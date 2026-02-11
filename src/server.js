/**
 * Servidor principal do sistema de contingência
 * Inicializa Express e expõe endpoint de webhook
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config/env');
const webhookController = require('./webhook');
const { initPrinterService, shutdownPrinterService } = require('./services/printerService');

const app = express();

// Caminhos dos arquivos
const ORDERS_LOG_PATH = path.join(__dirname, '../pedidos_refazer.json');
const DOWNLOADS_PATH = path.join(require('os').homedir(), 'Downloads');

/**
 * Gera relatório formatado dos pedidos
 */
function generateReport(orders) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  
  let report = `════════════════════════════════════════════════════════════
  📋 RELATÓRIO DE PEDIDOS - CONTINGÊNCIA
════════════════════════════════════════════════════════════
  Data: ${dateStr}
  Hora do relatório: ${timeStr}
  Total de pedidos: ${orders.length}
════════════════════════════════════════════════════════════

`;

  if (orders.length === 0) {
    report += '⚠️  Nenhum pedido registrado hoje.\n';
  } else {
    orders.forEach((order, index) => {
      const orderDate = new Date(order.timestamp);
      const orderTime = orderDate.toLocaleTimeString('pt-BR');
      
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `PEDIDO #${index + 1} - ID: ${order.id}\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `⏰ Hora: ${orderTime}\n`;
      
      if (order.nome) {
        report += `👤 Nome: ${order.nome}\n`;
      }
      report += `📱 Telefone: ${order.numero}\n`;
      
      if (order.item) {
        report += `🍔 Item(ns): ${order.item}\n`;
      }
      
      if (order.endereco) {
        report += `📍 Endereço: ${order.endereco}\n`;
      }
      
      report += `💳 Pagamento: ${order.pagamento}\n`;
      
      if (order.troco) {
        report += `💵 Troco: ${order.troco}\n`;
      }
      
      report += `\n`;
    });
  }
  
  report += `════════════════════════════════════════════════════════════
  Fim do relatório
════════════════════════════════════════════════════════════\n`;
  
  return report;
}

/**
 * Salva relatório dos pedidos antes de resetar
 */
function backupAndReset() {
  try {
    // Verificar se existe arquivo de pedidos
    if (!fs.existsSync(ORDERS_LOG_PATH)) {
      console.log('[SYSTEM] 📝 Arquivo de pedidos não existe. Criando novo...');
      fs.writeFileSync(ORDERS_LOG_PATH, '[]', 'utf-8');
      return;
    }
    
    // Carregar pedidos existentes
    const ordersData = fs.readFileSync(ORDERS_LOG_PATH, 'utf-8');
    const orders = JSON.parse(ordersData);
    
    if (orders.length > 0) {
      // Gerar relatório
      const report = generateReport(orders);
      
      // Nome do arquivo com data
      const now = new Date();
      const dateFileName = now.toISOString().split('T')[0]; // 2026-02-11
      const timeFileName = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // 12-30-45
      const fileName = `pedidos_${dateFileName}_${timeFileName}.txt`;
      const reportPath = path.join(DOWNLOADS_PATH, fileName);
      
      // Salvar relatório em Downloads
      fs.writeFileSync(reportPath, report, 'utf-8');
      
      console.log('[SYSTEM] 💾 Relatório salvo com sucesso!');
      console.log(`[SYSTEM] 📂 Local: ${reportPath}`);
      console.log(`[SYSTEM] 📊 Total de pedidos salvos: ${orders.length}`);
    } else {
      console.log('[SYSTEM] ℹ️  Nenhum pedido para gerar relatório.');
    }
    
    // Resetar arquivo para array vazio
    fs.writeFileSync(ORDERS_LOG_PATH, '[]', 'utf-8');
    console.log('[SYSTEM] 🔄 Arquivo de pedidos resetado para nova sessão.');
    
  } catch (error) {
    console.error('[SYSTEM] ❌ Erro ao fazer backup/reset:', error.message);
  }
}

// Middleware para parsing de JSON
app.use(express.json());

// Rota de health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    service: 'Evolution Automation - Sistema de Contingência',
    version: '1.0.0'
  });
});

// Rota principal do webhook
app.post('/webhook', webhookController.handleWebhook);

// Iniciar servidor
const PORT = config.server.port;

const server = app.listen(PORT, async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 SISTEMA DE CONTINGÊNCIA - EVOLUTION API');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Inicializar serviço de impressora
  await initPrinterService();
  
  // Backup de pedidos antigos e reset
  backupAndReset();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Servidor rodando na porta ${PORT}`);
  console.log(`  📥 Webhook: http://localhost:${PORT}/webhook`);
  console.log(`  🔗 Evolution: ${config.evolution.host}`);
  console.log(`  📱 Instância: ${config.evolution.instance}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Aguardando eventos...');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n[SYSTEM] ⚠️  Sinal SIGTERM recebido, desligando gracefully...');
  await shutdownPrinterService();
  server.close(() => {
    console.log('[SYSTEM] ✅ Servidor desligado');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n[SYSTEM] ⚠️  Sinal SIGINT recebido, desligando gracefully...');
  await shutdownPrinterService();
  server.close(() => {
    console.log('[SYSTEM] ✅ Servidor desligado');
    process.exit(0);
  });
});
