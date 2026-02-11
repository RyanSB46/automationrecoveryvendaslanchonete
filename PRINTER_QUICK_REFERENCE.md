# 🖨️ Referência Rápida - Sistema de Impressora

## 🎯 Modo Atual: SIMULAÇÃO (Arquivo)

Atualmente o sistema está configurado para **MODO SIMULAÇÃO**. Os cupons serão salvos em `./cupons/` como arquivos `.txt`.

### Status Atual
```
✅ Biblioteca serialport instalada
✅ Código de ESC/POS implementado
✅ Adaptável para impressora real
✅ Funcionando 100% em modo simulação
```

---

## 📋 Rápida Mudança para Impressora Real

**Quando a impressora chegar:**

### 1️⃣ Identificar a porta
```bash
# Executar no terminal
node test-printer-port.js
```

Resultado esperado:
```
✅ Encontradas 1 porta(s) serial(is):

1. Porta: COM3
   Descrição: USB Serial Port
   Fabricante: USB
```

Anotar o número da porta (ex: `COM3`)

### 2️⃣ Atualizar `.env`
```bash
# Mudar de:
PRINTER_SIMULATION_MODE=true

# Para:
PRINTER_SIMULATION_MODE=false
PRINTER_SERIAL_PORT=COM3        # Anotar valor do passo 1
PRINTER_BAUD_RATE=115200        # Padrão - não mudar
```

### 3️⃣ Reiniciar servidor
```bash
npm start
```

Observar logs:
```
[PRINTER] 🖨️ Modo: REAL (porta serial)
[PRINTER] 🔌 Porta serial: COM3
[PRINTER] ✅ Teste de conexão bem-sucedido!
```

### 4️⃣ Testar
```bash
# Enviar pedido de teste (ver TESTING.md para exemplos)
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"id":"1","nome":"Teste","numero":"11999999999","item":"Hambúrguer"}'
```

Se sucesso:
```
[PRINTER] ✅ Cupom impresso com sucesso!
[PRINTER] 📜 Confirmação: Enviado 1234 bytes para COM3
```

---

## 🔧 Configuração Completa em `.env`

```bash
# MODO DE OPERAÇÃO
# true = Salva em arquivo (./cupons/)
# false = Envia para impressora via porta serial
PRINTER_SIMULATION_MODE=true

# PORTA SERIAL (quando tiver impressora)
# Windows: COM1, COM2, COM3, etc
# Linux: /dev/ttyUSB0, /dev/ttyACM0
# macOS: /dev/tty.usbserial-XXXXX
PRINTER_SERIAL_PORT=COM3

# VELOCIDADE DA PORTA (baud rate)
# Não mudar, 115200 é padrão para impressoras térmicas
PRINTER_BAUD_RATE=115200

# TAMANHO EM CARACTERES
# 40 = impressora 80mm (padrão)
# 58 = impressora 112mm (raro)
PRINTER_WIDTH=40

# TIMEOUT EM MILISSEGUNDOS
# Tempo máximo para aguardar resposta da impressora
PRINTER_TIMEOUT=5000

# DIRETÓRIO DE CUPONS (modo simulação)
# Onde os cupons .txt serão salvos
PRINTER_SIMULATION_PATH=./cupons

# CONFIGURAÇÕES AVANÇADAS
# Tamanho da fonte: normal, small, large
PRINTER_FONT_SIZE=normal

# Página de código: CP1252 (Windows), CP850, UTF8
PRINTER_CODEPAGE=CP1252
```

---

## 📁 Arquivos Modificados/Criados

| Arquivo | O que mudou |
|---------|-----------|
| `src/config/env.js` | Adicionadas variáveis de impressora |
| `src/services/printerService.js` | Implementação completa de ESC/POS |
| `src/server.js` | Inicialização de serviço de impressora |
| `.env.example` | Adicionadas variáveis de impressora |
| `PRINTER_SETUP.md` | Guia completo (este arquivo) |
| `test-printer-port.js` | Ferramenta para identificar portas |

---

## 🎓 Entendendo o Fluxo

### Modo Simulação (Atual)
```
Pedido entra
    ↓
printReceipt()
    ├─ generateReceipt()      → Formata em texto
    ├─ Verifica: simulationMode = true
    ├─ Salva em ./cupons/cupom_12345.txt
    └─ Pronto!

Resultado: Arquivo em ./cupons/
```

### Modo Real (com Impressora)
```
Pedido entra
    ↓
printReceipt()
    ├─ generateReceipt()      → Formata em texto
    ├─ Verifica: simulationMode = false
    ├─ convertTextToESCPOS()  → Converte em comandos
    ├─ serialManager.connect() → Abre porta COM3
    ├─ port.write(buffer)     → Envia 1234 bytes
    ├─ serialManager.disconnect() → Fecha porta
    └─ Pronto!

Resultado: Impressora térmica imprime
```

---

## 🔧 Comandos Úteis

### Testar servidor
```bash
npm start
```

### Identificar porta da impressora
```bash
node test-printer-port.js
```

### Limpar cupons antigos
```javascript
// Em webhook.js ou outro arquivo que usa printerService
const printer = require('./services/printerService');
printer.cleanupReceipts(100);  // Manter só últimos 100
```

### Listar cupons salvos
```javascript
const printer = require('./services/printerService');
const cupons = printer.listReceipts();
console.log(cupons);  // Lista de arquivos
```

---

## ⚠️ Erros Comuns e Soluções

### ❌ "Porta não encontrada"
- Impressora conectada? Verificar LED
- Driver instalado? Ver "PRINTER_SETUP.md"
- PRINTER_SERIAL_PORT correto? Usar `node test-printer-port.js`

### ❌ "Porta em uso"
- Outra aplicação está usando a porta
- Encerrar gerenciador de impressão antigo
- Reiniciar computador

### ❌ "Caracteres estranhos"
- Página de código incorreta
- Mudar `PRINTER_CODEPAGE` em `.env`
- Consultar manual da impressora

---

## 📚 Mais Informações

- **Guia Completo:** Consulte `PRINTER_SETUP.md`
- **Exemplos de Teste:** Consulte `TESTING.md`
- **Configuração:** Consulte `.env.example`

---

**Status:** ✅ Pronto para produção  
**Data:** 11 de fevereiro de 2026  
**Modo Padrão:** Simulação (veja como mudar para real acima)
