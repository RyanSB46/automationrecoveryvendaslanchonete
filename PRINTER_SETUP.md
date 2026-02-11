# 🖨️ Guia Completo de Configuração da Impressora Térmica

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitectura Implementada](#arquitectura-implementada)
3. [Modo Simulação vs Modo Real](#modo-simulação-vs-modo-real)
4. [Passo a Passo: De Simulação para Impressora Real](#passo-a-passo-de-simulação-para-impressora-real)
5. [Identificar a Porta Serial](#identificar-a-porta-serial)
6. [Solução de Problemas](#solução-de-problemas)
7. [Referência Técnica](#referência-técnica)

---

## 🎯 Visão Geral

O sistema foi totalmente refatorado para suportar **duas formas de operação**:

### ✅ Modo Simulação (Padrão)
```
Pedido → Serviço de Impressão → Salva em arquivo .txt (cupons/)
```
Perfeito para desenvolvimento e testes **SEM impressora física**.

### 🖨️ Modo Real (com Impressora)
```
Pedido → Serviço de Impressão → Converte ESC/POS → Porta Serial → Impressora Imprime
```
Quando a impressora estiver conectada.

---

## 🏗️ Arquitectura Implementada

### Componentes Principais

#### 1. **ESCPOSGenerator** (Gerador de Comandos)
Classe responsável por converter texto simples em comandos ESC/POS:

```
Texto "Olá" → ESC @ ESC E GS ! ... → Buffer de bytes
                ↓
            Envia para impressora
```

Comandos implementados:
- `ESC @` → Inicializa impressora
- `ESC E` → Ativa/desativa negrito
- `ESC a` → Define alinhamento (esquerda/centro/direita)
- `GS !` → Define tamanho da fonte
- `GS V` → Corta papel
- `ESC p` → Abre gaveta de dinheiro

#### 2. **PrinterSerialManager** (Gerenciador de Porta)
Classe que gerencia a conexão com a porta serial:

```
conectar() → serial aberta → write(buffer) → desconectar()
```

Recuros:
- Abertura/fechamento seguro de porta
- Tratamento de timeouts
- Detecção de erros de hardware
- Fallback automático para arquivo em caso de erro

#### 3. **printReceipt()** (Função Principal)
Função que integra tudo:

```javascript
printReceipt(pedido)
    ↓
generateReceipt(pedido) → Texto formatado
    ↓
    ├─ SimulaçãoMode: salva em cupons/
    │
    └─ ModoReal:
        ├─ convertTextToESCPOS() → ESCPOSGenerator
        ├─ serialManager.connect() → Abre porta COM
        ├─ port.write() → Envia buffer
        └─ serialManager.disconnect() → Fecha porta
```

---

## 🔄 Modo Simulação vs Modo Real

### Modo Simulação (`PRINTER_SIMULATION_MODE=true`)

**Arquivo de configuração:**
```bash
PRINTER_SIMULATION_MODE=true
PRINTER_SIMULATION_PATH=./cupons
```

**Comportamento:**
```
✅ Nenhuma impressora necessária
✅ Cupons salvos em ./cupons/cupom_*.txt
✅ Simples de testar e debugar
✅ Sem dependências de hardware
❌ Não imprime nada fisicamente
```

**Exemplo de saída:**
```
[PRINTER] ✅ Cupom salvo em arquivo: ./cupons/cupom_123456_1234567890.txt
[PRINTER] 📄 Simulação de impressão:

═══════════════════════════════════════════
        🍔 CASA DO HAMBÚRGUER 🍔
        SISTEMA DE CONTINGÊNCIA
═══════════════════════════════════════════
...
```

### Modo Real (`PRINTER_SIMULATION_MODE=false`)

**Arquivo de configuração:**
```bash
PRINTER_SIMULATION_MODE=false
PRINTER_SERIAL_PORT=COM3
PRINTER_BAUD_RATE=115200
```

**Comportamento:**
```
✅ Comunica com impressora real
✅ Envia via porta serial
✅ Impressora física imprime
❌ Requer hardware conectado
❌ Mais complexo para debugar
```

**Exemplo de saída:**
```
[PRINTER] 🖨️ Iniciando impressão em modo REAL...
[PRINTER] ✅ Porta COM3 aberta com sucesso (115200 baud)
[PRINTER] ✅ Cupom impresso com sucesso!
[PRINTER] 📜 Confirmação: Enviado 1234 bytes para COM3
```

---

## 🚀 Passo a Passo: De Simulação para Impressora Real

### Fase 1: Desenvolvimento (Agora - sem impressora)

**Estado atual:** ✅ Tudo já está configurado!

```bash
# .env (padrão)
PRINTER_SIMULATION_MODE=true
PRINTER_SIMULATION_PATH=./cupons
```

**O que acontece:**
```
1. npm start
2. Servidor inicia
3. Cupons são salvos em ./cupons/
4. Sem necessidade de impressora
```

### Fase 2: Aquisição da Impressora

**O que você vai receber:**
- [ ] Impressora térmica 80mm (geralmente Bematech ou similar)
- [ ] Cabo USB ou serial
- [ ] Manual/Datasheet (geralmente com "ESC/POS" escrito)

### Fase 3: Instalação do Hardware

**Windows:**
1. Conectar impressora via USB
2. Windows detecta automaticamente
3. Abrir "Gerenciador de Dispositivos"
4. Procurar em "Portas (COM e LPT)"
5. Procurar por "USB Serial Port" ou similar
6. Anotar o número (ex: COM3, COM4)

**Linux:**
```bash
# Listar portas seriais
ls -la /dev/tty*

# Procurar por:
# /dev/ttyUSB0 (impressora USB)
# /dev/ttyACM0 (Arduino/compatível)
# /dev/ttyS0 (porta serial real)
```

**macOS:**
```bash
# Listar portas seriais
ls -la /dev/tty.*

# Procurar por:
# /dev/tty.usbserial-XXXXX
```

### Fase 4: Configurar o Sistema

**Editar `.env` com as informações da impressora:**

```bash
# ANTES (simulação)
PRINTER_SIMULATION_MODE=true

# DEPOIS (modo real)
PRINTER_SIMULATION_MODE=false
PRINTER_SERIAL_PORT=COM3          # Porta identificada no Passo 3
PRINTER_BAUD_RATE=115200          # 115200 é o padrão
PRINTER_TIMEOUT=5000              # 5 segundos
```

### Fase 5: Teste Inicial

```bash
# 1. Reiniciar servidor
npm start

# 2. Observar logs
[PRINTER] 🖨️ Modo: REAL (porta serial)
[PRINTER] 🔌 Porta serial: COM3
[PRINTER] ⚙️  Taxa de transmissão: 115200 baud
[PRINTER] ✅ Teste de conexão bem-sucedido!

# 3. Se der erro, ver "Solução de Problemas" abaixo
```

### Fase 6: Testar Impressão de Cupom

Enviar um pedido via webhook:
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"id":"1","nome":"Teste","numero":"11999999999","item":"Hambúrguer X01"}'
```

Esperar pela saída:
```
[PRINTER] ✅ Cupom impresso com sucesso!
[PRINTER] 📜 Confirmação: Enviado 1234 bytes para COM3
```

---

## 🔍 Identificar a Porta Serial

### Windows (Gerenciador de Dispositivos)

```
1. Pressionar Win + X
2. Selecionar "Gerenciador de Dispositivos"
3. Expandir "Portas (COM e LPT)"
4. Procurar por:
   - "USB Serial Port (COM3)" ← Anotar COM3
   - "Impressora Desconhecida"
   - Qualquer porta nova que apareça
5. Se não aparecer = driver não instalado
```

### Windows (PowerShell - Automático)

```powershell
# Conectar impressora
# Esperar 5 segundos

# Executar:
Get-WmiObject Win32_SerialPort | Select-Object Name, DeviceID

# Resultado esperado:
# Name       DeviceID
# ----       --------
# COM3       COM3

# Se não aparecer nada, ver "Solução de Problemas"
```

### Windows (Listar todas as portas COM)

```powershell
[System.IO.Ports.SerialPort]::GetPortNames()

# Resultado esperado:
# COM1
# COM3
# COM4
```

### Teste Rápido de Porta (Node.js)

```javascript
// test-printer-port.js
const SerialPort = require('serialport');

SerialPort.SerialPort.list().then(ports => {
  console.log('Portas disponíveis:');
  ports.forEach(port => {
    console.log(`  ${port.path} - ${port.description}`);
  });
});
```

Executar:
```bash
node test-printer-port.js

# Resultado esperado:
# Portas disponíveis:
#   COM3 - USB Serial Port
#   COM1 - Intel(R) Active Management Technology Serial Port (IOCTL interface)
```

---

## 🆘 Solução de Problemas

### ❌ Problema: "Porta não encontrada"

```
[PRINTER] ❌ Falha ao conectar à impressora
[PRINTER] 💡 Verifique se a impressora está conectada em COM3
```

**Solução:**

1. **Verificar se a impressora está conectada:**
   ```
   ✓ Cabo USB/Serial conectado físicamente
   ✓ Impressora ligada (LED aceso)
   ✓ Nenhuma mensagem de erro no Windows
   ```

2. **Identificar a porta correta:**
   ```powershell
   Get-WmiObject Win32_SerialPort | Select-Object Name, DeviceID
   ```

3. **Atualizar `.env` com a porta correta:**
   ```bash
   PRINTER_SERIAL_PORT=COM4  # Ao invés de COM3
   ```

4. **Reiniciar servidor:**
   ```bash
   npm start
   ```

---

### ❌ Problema: "Driver não instalado"

```
[PRINTER] ❌ Erro ao abrir porta COM3
[PRINTER] A porta não existe ou está em uso
```

**Solução:**

1. **Baixar driver do fabricante:**
   - Bematech: http://bematech.com.br/support
   - Daruma: http://www.daruma.com.br
   - Outra marca: buscar "[marca] driver serial windows"

2. **Instalar driver**

3. **Reconectar impressora**

4. **Verificar porta novamente:**
   ```powershell
   Get-WmiObject Win32_SerialPort
   ```

---

### ❌ Problema: "Porta em uso"

```
[PRINTER] ❌ Erro ao abrir porta COM3
[PRINTER] Port is already open
```

**Solução:**

Alguma outra aplicação está usando a porta:

1. **Encerrar aplicações que usam serial:**
   - Gerenciadores de impressora antigos
   - Software de faturamento
   - Programas de caixa

2. **Verificar no Gerenciador de Dispositivos se há símbolos de erro**

3. **Reiniciar o computador**

4. **Tentar porta diferente**

---

### ❌ Problema: "Garras de papel soltas"

```
[PRINTER] ✅ Cupom impresso com sucesso!
[PRINTER] 📄 Mas o papel não avançou/cortou
```

**Solução:**

1. **Verificar se papel está carregado corretamente:**
   - Abrir compartimento frontal
   - Inserir papel até ouvir um clique
   - Fechar compartimento

2. **Verificar se há papel:**
   - Impressora térmica não precisa de tinta
   - Mas precisa de papel térmico 80mm

3. **Testar impressora manualmente:**
   - Desligar impressora
   - Desligar por 10 segundos
   - Ligar novamente
   - Testá botão de teste de saída

4. **Verificar comando de corte:**
   ```javascript
   // Em PRINTER_SETUP.md, linha 120
   escpos.cut(1); // 1 = corte total, 0 = corte parcial
   ```

---

### ❌ Problema: "Caracteres estranhos na impressão"

```
[PRINTER] ✅ Cupom impresso com sucesso!
[PRINTER] 📟 Mas saiu: ÄËÖ×Ø□ (lixo)
```

**Resolução de Codificação:**

O problema é que a página de código da impressora não corresponde:

1. **Verificar página de código da impressora:**
   - No manual, procurar por "codepage" ou "character set"
   - Comum: CP1252, CP850, CP858

2. **Atualizar `.env`:**
   ```bash
   PRINTER_CODEPAGE=CP1252  # Ou a correta conforme manual
   ```

3. **Atualizar `printerService.js` (função `convertTextToESCPOS`):**
   ```javascript
   // Linha ~340
   encodeText(text) {
     return Buffer.from(text, 'utf8');  // Ajustar se necessário
   }
   ```

---

## 📚 Referência Técnica

### Variáveis de Ambiente

```bash
# Modo de operação
PRINTER_SIMULATION_MODE=true|false

# Configuração de porta (modo real)
PRINTER_SERIAL_PORT=COM3
PRINTER_BAUD_RATE=115200 (padrão)

# Dimensões
PRINTER_WIDTH=40  (80mm) | 58 (112mm raro)

# Timeouts
PRINTER_TIMEOUT=5000

# Diretório de simulação
PRINTER_SIMULATION_PATH=./cupons

# Configurações avançadas
PRINTER_FONT_SIZE=normal|small|large
PRINTER_CODEPAGE=CP1252|CP850|CP858|UTF8
```

### Comandos ESC/POS Implementados

| Comando | Bytes | Função |
|---------|-------|--------|
| `ESC @` | `1B 40` | Inicializa impressora |
| `ESC a` | `1B 61 [0-2]` | Alinhamento (0=esq, 1=cen, 2=dir) |
| `ESC E` | `1B 45 [0-1]` | Negrito (0=off, 1=on) |
| `GS !` | `1D 21 [00-77]` | Tamanho fonte |
| `GS V` | `1D 56 [0-1]` | Corte (0=parcial, 1=total) |
| `ESC p` | `1B 70 00 19 19` | Abre gaveta dinheiro |
| `LF` | `0A` | Nova linha |

### Classes Exportadas

```javascript
// printerService.js exports:

// Funções principais
await printReceipt(order)      // Imprime cupom
generateReceipt(order)         // Gera texto
await initPrinterService()     // Inicializa
await shutdownPrinterService() // Desliga

// Classes para uso avançado
new ESCPOSGenerator()          // Gera comandos ESC/POS
new PrinterSerialManager()     // Gerencia porta serial

// Configuração
config.printer.*               // Todas as settings
serialManager                  // Instância do gerenciador
```

### Fluxo de Dados (Diagramático)

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK RECEBE PEDIDO                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    printReceipt(order)
                         │
        ┌────────────────┴────────────────┐
        │                                 │
    SIMULAÇÃO                         MODO REAL
        │                                 │
        ├─ generateReceipt()              ├─ generateReceipt()
        │  └─ Cupom em texto              │  └─ Cupom em texto
        │                                 │
        ├─ fs.writeFileSync()             ├─ convertTextToESCPOS()
        │  └─ cupons/cupom_*.txt          │  └─ ESCPOSGenerator.getBuffer()
        │                                 │
        └─-> Arquivo salvo               ├─ serialManager.connect()
                                          │  └─ Abre porta COM
             Nenhuma impressora              │
             necessária!                  ├─ port.write(buffer)
                                          │  └─ Envia bytes
                                          │
                                          ├─ serialManager.disconnect()
                                          │  └─ Fecha porta
                                          │
                                          └─-> Impressora
                                                 imprime
```

---

## 🎓 Próximos Passos

1. **Instalar biblioteca:**
   ```bash
   npm install serialport  # ✅ Já instalado
   ```

2. **Configurar `.env`:**
   - Deixar em `PRINTER_SIMULATION_MODE=true` enquanto não tiver impressora
   - Quando tiver impressora, mudar para `false` e ajustar porta

3. **Testar no modo simulação:**
   ```bash
   npm start
   # Copiar pasteone curl do TESTING.md
   # Verificar se cupom aparece em ./cupons/
   ```

4. **Quando impressora chegar:**
   - Identificar porta (Gerenciador de Dispositivos)
   - Atualizar `.env`
   - Testar com um cupom
   - Se der erro, ver "Solução de Problemas"

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs completos (mostram exatamente qual foi o erro)
2. Consultar "Solução de Problemas" acima
3. Verificar manual da impressora para:
   - Página de código correta
   - Taxa de transmissão
   - Comandos específicos do modelo

---

**Status:** ✅ Implementado e Pronto  
**Data:** 11 de fevereiro de 2026  
**Modo Padrão:** Simulação (arquivo)  
**Modo Real:** Pronto para conectar impressora
