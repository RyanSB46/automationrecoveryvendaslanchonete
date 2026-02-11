/**
 * Serviço de impressora de cupom
 * Suporta modo simulação (arquivo) e modo real (porta serial com ESC/POS)
 * Impressora térmica 80mm padrão brasileira
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/env');

// Carregar SerialPort apenas se não for modo simulação
let SerialPort;
if (!config.printer.simulationMode) {
  SerialPort = require('serialport');
}

/**
 * Classe para gerenciar conexão com impressora serial
 * Implementa protocolo ESC/POS para impressoras térmicas 80mm
 */
class PrinterSerialManager {
  constructor() {
    this.port = null;
    this.isOpen = false;
    this.isConnecting = false;
  }

  /**
   * Abre conexão com porta serial
   * @returns {Promise<boolean>}
   */
  async connect() {
    if (this.isOpen || this.isConnecting) {
      console.log('[PRINTER] ⏳ Conexão já está aberta ou conectando...');
      return this.isOpen;
    }

    this.isConnecting = true;

    try {
      this.port = new SerialPort.SerialPort({
        path: config.printer.serialPort,
        baudRate: config.printer.baudRate,
        autoOpen: false
      });

      return new Promise((resolve) => {
        this.port.open((err) => {
          this.isConnecting = false;

          if (err) {
            console.error(`[PRINTER] ❌ Erro ao abrir porta ${config.printer.serialPort}:`, err.message);
            console.error(`[PRINTER] 💡 Verifique se a impressora está conectada e use o Gerenciador de Dispositivos para encontrar a porta correta`);
            this.isOpen = false;
            resolve(false);
            return;
          }

          this.isOpen = true;
          console.log(`[PRINTER] ✅ Porta ${config.printer.serialPort} aberta com sucesso (${config.printer.baudRate} baud)`);
          resolve(true);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('[PRINTER] ❌ Erro ao conectar:', error.message);
      this.isOpen = false;
      return false;
    }
  }

  /**
   * Fecha conexão com porta serial
   * @returns {Promise<boolean>}
   */
  async disconnect() {
    return new Promise((resolve) => {
      if (!this.port || !this.isOpen) {
        resolve(true);
        return;
      }

      this.port.close((err) => {
        if (err) {
          console.error('[PRINTER] ❌ Erro ao fechar porta:', err.message);
          resolve(false);
        } else {
          this.isOpen = false;
          console.log('[PRINTER] ✅ Porta serial fechada');
          resolve(true);
        }
      });
    });
  }

  /**
   * Escreve dados na porta serial
   * @param {Buffer} data - Dados a enviar
   * @returns {Promise<boolean>}
   */
  async write(data) {
    if (!this.isOpen) {
      console.error('[PRINTER] ❌ Porta serial não está aberta');
      return false;
    }

    return new Promise((resolve) => {
      this.port.write(data, (err) => {
        if (err) {
          console.error('[PRINTER] ❌ Erro ao enviar dados:', err.message);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Aguarda resposta da impressora (para verificar status)
   * @param {number} timeout - Tempo máximo de espera em ms
   * @returns {Promise<Buffer>}
   */
  async read(timeout = 1000) {
    return new Promise((resolve) => {
      let data = Buffer.alloc(0);
      const timer = setTimeout(() => {
        this.port.off('data', onData);
        resolve(data);
      }, timeout);

      const onData = (chunk) => {
        data = Buffer.concat([data, chunk]);
      };

      this.port.on('data', onData);
    });
  }
}

/**
 * Classe para gerar comandos ESC/POS
 * Padrão para impressoras térmicas 80mm
 */
class ESCPOSGenerator {
  constructor() {
    this.commands = Buffer.alloc(0);
  }

  /**
   * Inicializa impressora
   */
  init() {
    // ESC @ - Reset da impressora
    this.commands = Buffer.concat([
      this.commands,
      Buffer.from([0x1B, 0x40])
    ]);
    return this;
  }

  /**
   * Define alinhamento (0=esquerda, 1=centro, 2=direita)
   */
  setAlign(align = 1) {
    // ESC a - Alinhamento (0, 1, 2)
    this.commands = Buffer.concat([
      this.commands,
      Buffer.from([0x1B, 0x61, align])
    ]);
    return this;
  }

  /**
   * Define negrito (0=desligado, 1=ligado)
   */
  setBold(bold = 0) {
    // ESC E - Negrito
    this.commands = Buffer.concat([
      this.commands,
      Buffer.from([0x1B, 0x45, bold])
    ]);
    return this;
  }

  /**
   * Define tamanho da fonte (altura e largura)
   * height: 0-7, width: 0-7 (0=1x, 1=2x, etc)
   */
  setFontSize(height = 0, width = 0) {
    // GS ! - Tamanho da fonte
    this.commands = Buffer.concat([
      this.commands,
      Buffer.from([0x1D, 0x21, height << 4 | width])
    ]);
    return this;
  }

  /**
   * Adiciona texto com quebra de linha
   */
  addText(text = '') {
    const encoded = this.encodeText(text);
    this.commands = Buffer.concat([
      this.commands,
      encoded,
      Buffer.from([0x0A]) // Line Feed
    ]);
    return this;
  }

  /**
   * Adiciona linha horizontal
   */
  addLine(char = '─', width = 40) {
    const line = char.repeat(width);
    return this.addText(line);
  }

  /**
   * Centraliza texto
   */
  addCenteredText(text = '', width = 40) {
    this.setAlign(1); // Centro
    const encoded = this.encodeText(text);
    this.commands = Buffer.concat([
      this.commands,
      encoded,
      Buffer.from([0x0A])
    ]);
    this.setAlign(0); // Volta para esquerda
    return this;
  }

  /**
   * Corta papel (total ou parcial)
   * mode: 0=parcial, 1=total
   */
  cut(mode = 0) {
    // GS V - Corte
    this.commands = Buffer.concat([
      this.commands,
      Buffer.from([0x1D, 0x56, mode])
    ]);
    return this;
  }

  /**
   * Soa buzzer
   */
  beep(times = 1, duration = 100) {
    // GS ( A - Buzzer (proprietary command, não padrão ESC/POS)
    // Alguns modelos suportam
    return this;
  }

  /**
   * Abre gaveta de dinheiro
   */
  openDrawer() {
    // ESC p - Abre gaveta
    this.commands = Buffer.concat([
      this.commands,
      Buffer.from([0x1B, 0x70, 0x00, 0x19, 0x19])
    ]);
    return this;
  }

  /**
   * Retorna os comandos gerados como Buffer
   */
  getBuffer() {
    return this.commands;
  }

  /**
   * Reseta os comandos
   */
  reset() {
    this.commands = Buffer.alloc(0);
    return this;
  }

  /**
   * Codifica texto para UTF-8 com suporte a acentuação
   */
  encodeText(text) {
    try {
      return Buffer.from(text, 'utf8');
    } catch (error) {
      console.error('[PRINTER] ⚠️ Erro ao codificar texto:', error.message);
      // Fallback para ASCII
      return Buffer.from(text, 'ascii');
    }
  }
}

// Instância global do gerenciador serial
const serialManager = new PrinterSerialManager();


/**
 * Cria diretório de cupons se não existir (modo simulação)
 */
function ensureOutputDirectory() {
  if (config.printer.simulationMode) {
    const outputPath = path.resolve(config.printer.simulationOutputPath);
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
      console.log(`[PRINTER] 📁 Diretório de cupons criado: ${outputPath}`);
    }
  }
}

/**
 * Centraliza texto
 * @param {string} text - Texto a centralizar
 * @param {number} width - Largura da linha
 */
function centerText(text, width = config.printer.width) {
  const spaces = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(spaces) + text;
}

/**
 * Linha repetida de caracteres
 * @param {string} char - Caractere a repetir
 * @param {number} width - Largura da linha
 */
function line(char = '═', width = config.printer.width) {
  return char.repeat(width);
}

/**
 * Formata valor monetário
 * @param {number|string} value - Valor a formatar
 */
function formatMoney(value) {
  if (!value) return 'N/A';
  return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

/**
 * Gera cupom formatado em 80mm (Opção A - Estruturado)
 * @param {Object} order - Objeto do pedido com todes os dados
 * @returns {string} - Cupom formatado
 */
function generateReceiptOptionA(order) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  // Extrair informações do pedido
  const {
    id = 'N/A',
    nome = 'Cliente',
    numero = 'N/A',
    item = 'N/A',
    endereco = 'N/A',
    pagamento = 'N/A',
    troco = null
  } = order;
  
  let receipt = '';
  
  // Cabeçalho
  receipt += line('═') + '\n';
  receipt += centerText('🍔 CASA DO HAMBÚRGUER 🍔') + '\n';
  receipt += centerText('SISTEMA DE CONTINGÊNCIA') + '\n';
  receipt += line('═') + '\n';
  receipt += '\n';
  
  // Data e Hora
  receipt += `📅 ${dateStr}\n`;
  receipt += `⏰ ${timeStr}\n`;
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Número do pedido
  receipt += centerText(`PEDIDO #${id}`) + '\n';
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Cliente
  receipt += 'CLIENTE:\n';
  receipt += `👤 ${nome}\n`;
  receipt += `📱 ${numero}\n`;
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Itens
  receipt += 'ITENS:\n';
  
  // Quebrar item em múltiplas linhas se necessário
  const itemLines = item.match(/.{1,38}/g) || [item];
  itemLines.forEach((line_item, index) => {
    if (index === 0) {
      receipt += `• ${line_item}\n`;
    } else {
      receipt += `  ${line_item}\n`;
    }
  });
  
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Endereço
  receipt += 'ENDEREÇO:\n';
  if (endereco && endereco !== 'N/A') {
    const enderecoLines = endereco.match(/.{1,38}/g) || [endereco];
    enderecoLines.forEach(eline => {
      receipt += `📍 ${eline}\n`;
    });
  } else {
    receipt += '📍 RETIRADA NA LOJA\n';
  }
  
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Pagamento
  receipt += 'PAGAMENTO:\n';
  receipt += `💳 ${pagamento}\n`;
  
  // Troco (se aplicável)
  if (troco) {
    receipt += `💵 Troco: ${troco}\n`;
  }
  
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Observação
  receipt += centerText('⚠️ SISTEMA DE CONTINGÊNCIA') + '\n';
  receipt += centerText('Sistema principal indisponível') + '\n';
  receipt += '\n';
  
  // Rodapé
  receipt += centerText('Obrigado pela preferência!') + '\n';
  receipt += centerText('🙏') + '\n';
  receipt += line('═') + '\n';
  receipt += '\n';
  
  return receipt;
}

/**
 * Gera cupom formatado em 80mm (Opção B - Texto Livre)
 * Apenas cola o texto que o cliente enviou
 * @param {Object} order - Objeto do pedido
 * @returns {string} - Cupom formatado
 */
function generateReceiptOptionB(order) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  // Extrair informações do pedido
  const {
    id = 'N/A',
    nome = 'Cliente',
    numero = 'N/A',
    item = 'N/A (sem detalhes)'
  } = order;
  
  let receipt = '';
  
  // Cabeçalho
  receipt += line('═') + '\n';
  receipt += centerText('🍔 CASA DO HAMBÚRGUER 🍔') + '\n';
  receipt += centerText('SISTEMA DE CONTINGÊNCIA') + '\n';
  receipt += line('═') + '\n';
  receipt += '\n';
  
  // Data e Hora
  receipt += `📅 ${dateStr}\n`;
  receipt += `⏰ ${timeStr}\n`;
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Número do pedido
  receipt += centerText(`PEDIDO #${id}`) + '\n';
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Cliente
  receipt += 'CLIENTE:\n';
  receipt += `👤 ${nome}\n`;
  receipt += `📱 ${numero}\n`;
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Dados do pedido (texto livre)
  receipt += 'PEDIDO:\n';
  const itemLines = item.match(/.{1,38}/g) || [item];
  itemLines.forEach(line_item => {
    receipt += `${line_item}\n`;
  });
  receipt += line('─') + '\n';
  receipt += '\n';
  
  // Observação
  receipt += centerText('⚠️ SISTEMA DE CONTINGÊNCIA') + '\n';
  receipt += centerText('Sistema principal indisponível') + '\n';
  receipt += '\n';
  
  // Rodapé
  receipt += centerText('Obrigado pela preferência!') + '\n';
  receipt += centerText('🙏') + '\n';
  receipt += line('═') + '\n';
  receipt += '\n';
  
  return receipt;
}

/**
 * Gera cupom formatado em 80mm
 * Detecta automaticamente se é Opção A ou B
 * @param {Object} order - Objeto do pedido com todes os dados
 * @returns {string} - Cupom formatado
 */
function generateReceipt(order) {
  // Detectar se é Opção B (texto livre) pela marcação do pagamento
  if (order.pagamento === 'TEXTO_LIVRE') {
    return generateReceiptOptionB(order);
  } else {
    // Opção A (estruturada)
    return generateReceiptOptionA(order);
  }
}

/**
 * Converte cupom de texto simples para comandos ESC/POS
 * @param {string} receiptText - Texto do cupom
 * @returns {ESCPOSGenerator} - Gerador com comandos
 */
function convertTextToESCPOS(receiptText) {
  const escpos = new ESCPOSGenerator();
  
  escpos.init(); // Inicializa impressora
  escpos.setAlign(1); // Alinhamento centro
  
  const lines = receiptText.split('\n');
  
  lines.forEach((textLine) => {
    // Remove emojis para modo texto puro (opcional)
    const cleanLine = textLine.replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII
    
    if (cleanLine.trim().length === 0) {
      escpos.addText(''); // Linha vazia
    } else if (cleanLine.includes('═') || cleanLine.includes('─')) {
      // É uma linha de separação
      escpos.addText(cleanLine);
    } else {
      // Texto normal
      escpos.addText(cleanLine);
    }
  });
  
  // Finaliza cupom
  escpos.setAlign(0); // Volta alinhamento esquerda
  escpos.addText('');
  escpos.addText('');
  escpos.cut(1); // Corta papel (total)
  
  return escpos;
}

/**
 * Imprime (ou simula) um cupom
 * Em modo simulação: salva em arquivo
 * Em modo real: envia para porta serial com ESC/POS
 * 
 * @param {Object} order - Objeto do pedido
 * @returns {Promise<boolean>} - true se sucesso
 */
async function printReceipt(order) {
  try {
    const receipt = generateReceipt(order);
    
    if (config.printer.simulationMode) {
      // ====== MODO SIMULAÇÃO: Arquivo ======
      ensureOutputDirectory();
      
      const fileName = `cupom_${order.id || Date.now()}_${new Date().getTime()}.txt`;
      const outputPath = path.resolve(config.printer.simulationOutputPath);
      const filePath = path.join(outputPath, fileName);
      
      fs.writeFileSync(filePath, receipt, 'utf-8');
      
      console.log(`[PRINTER] ✅ Cupom salvo em arquivo: ${filePath}`);
      console.log(`[PRINTER] 📄 Simulação de impressão:`);
      console.log('');
      console.log(receipt);
      console.log('');
      
      return true;
    } else {
      // ====== MODO REAL: Porta Serial ESC/POS ======
      console.log(`[PRINTER] 🖨️ Iniciando impressão em modo REAL...`);
      
      // Conecta à impressora
      const connected = await serialManager.connect();
      if (!connected) {
        console.error('[PRINTER] ❌ Falha ao conectar à impressora');
        console.error(`[PRINTER] 💡 Verifique se a impressora está conectada em ${config.printer.serialPort}`);
        console.error(`[PRINTER] 💡 Use Gerenciador de Dispositivos (Windows) ou 'ls /dev/tty*' (Linux) para encontrar a porta`);
        
        // Fallback: salva em arquivo mesmo assim
        console.log('[PRINTER] 📝 Salvando em arquivo como fallback...');
        ensureOutputDirectory();
        const fileName = `cupom_${order.id || Date.now()}_${new Date().getTime()}_ERRO.txt`;
        const outputPath = path.resolve(config.printer.simulationOutputPath);
        const filePath = path.join(outputPath, fileName);
        fs.writeFileSync(filePath, receipt, 'utf-8');
        console.log('[PRINTER] 💾 Cupom salvo em:', filePath);
        
        return false;
      }
      
      // Converte texto para ESC/POS
      const escpos = convertTextToESCPOS(receipt);
      const buffer = escpos.getBuffer();
      
      // Envia para impressora
      const written = await serialManager.write(buffer);
      
      if (!written) {
        console.error('[PRINTER] ❌ Falha ao enviar dados para impressora');
        await serialManager.disconnect();
        return false;
      }
      
      // Aguarda um pouco para a impressora processar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Desconecta
      await serialManager.disconnect();
      
      console.log(`[PRINTER] ✅ Cupom impresso com sucesso!`);
      console.log(`[PRINTER] 📜 Confirmação: Enviado ${buffer.length} bytes para ${config.printer.serialPort}`);
      
      return true;
    }
    
  } catch (error) {
    console.error(`[PRINTER] ❌ Erro crítico ao imprimir cupom:`, error.message);
    console.error('[PRINTER] Stack:', error.stack);
    return false;
  }
}

/**
 * Obtém lista de cupons salvos (modo simulação)
 * @returns {Array} - Array de nomes de arquivos
 */
function listReceipts() {
  try {
    const outputPath = path.resolve(config.printer.simulationOutputPath);
    if (!fs.existsSync(outputPath)) {
      return [];
    }
    return fs.readdirSync(outputPath);
  } catch (error) {
    console.error('[PRINTER] ❌ Erro ao listar cupons:', error.message);
    return [];
  }
}

/**
 * Limpa cupons antigos (opcional)
 * @param {number} maxFiles - Quantidade máxima de cupons a manter
 */
function cleanupReceipts(maxFiles = 100) {
  try {
    const outputPath = path.resolve(config.printer.simulationOutputPath);
    if (!fs.existsSync(outputPath)) {
      return;
    }
    
    const files = fs.readdirSync(outputPath)
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(outputPath, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length > maxFiles) {
      const filesToDelete = files.slice(maxFiles);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(outputPath, file.name));
      });
      console.log(`[PRINTER] 🧹 ${filesToDelete.length} cupons antigos removidos`);
    }
  } catch (error) {
    console.error('[PRINTER] ❌ Erro ao limpar cupons:', error.message);
  }
}

/**
 * Inicializa o serviço de impressora (conecta ao hardware se modo real)
 * @returns {Promise<boolean>}
 */
async function initPrinterService() {
  console.log('[PRINTER] 🚀 Iniciando serviço de impressora...');
  console.log(`[PRINTER] 📋 Modo: ${config.printer.simulationMode ? 'SIMULAÇÃO (arquivo)' : 'REAL (porta serial)'}`);
  
  if (!config.printer.simulationMode) {
    console.log(`[PRINTER] 🔌 Porta serial: ${config.printer.serialPort}`);
    console.log(`[PRINTER] ⚙️  Taxa de transmissão: ${config.printer.baudRate} baud`);
    console.log(`[PRINTER] ⏱️  Timeout: ${config.printer.timeout}ms`);
    
    // Testa conexão inicial
    const testConnect = await serialManager.connect();
    if (testConnect) {
      await serialManager.disconnect();
      console.log('[PRINTER] ✅ Teste de conexão bem-sucedido!');
    } else {
      console.warn('[PRINTER] ⚠️  Impressora não detectada, mas você pode tentar conectar depois');
    }
  } else {
    ensureOutputDirectory();
    console.log(`[PRINTER] 💾 Cupons serão salvos em: ${path.resolve(config.printer.simulationOutputPath)}`);
  }
  
  console.log('[PRINTER] ✅ Serviço de impressora pronto!');
  return true;
}

/**
 * Finaliza o serviço de impressora (desconecta se necessário)
 * @returns {Promise<boolean>}
 */
async function shutdownPrinterService() {
  console.log('[PRINTER] 🛑 Desligando serviço de impressora...');
  
  if (!config.printer.simulationMode && serialManager.isOpen) {
    await serialManager.disconnect();
  }
  
  console.log('[PRINTER] ✅ Serviço de impressora desligado');
  return true;
}

module.exports = {
  // Funções de impressão
  printReceipt,
  generateReceipt,
  
  // Funções de gerenciamento
  listReceipts,
  cleanupReceipts,
  
  // Ciclo de vida
  initPrinterService,
  shutdownPrinterService,
  
  // Classes (para uso avançado)
  PrinterSerialManager,
  ESCPOSGenerator,
  
  // Configuração
  config: config.printer,
  serialManager
};
