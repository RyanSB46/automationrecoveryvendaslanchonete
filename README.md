# 🍔 Automation Recovery — Vendas Lanchonete

Sistema de automação inteligente com contingência para lanchonete, integrado com Evolution API (WhatsApp).

## 🎯 Funcionalidades Principais

✅ **Broadcast de Contingência** — Avisa clientes quando sistema cai  
✅ **Sistema de Pedidos Refazer** — Permite refazer pedidos via WhatsApp  
✅ **Opção A** — Conversação por etapas (natural e intuitiva)  
✅ **Opção B** — Dados em uma única mensagem (rápido)  
✅ **Gerenciamento de Consentimento** — Opt-in/opt-out automático  
✅ **Controle de Autorização** — Apenas admins podem disparar alertas  
✅ **Logs de Pedidos** — Registro completo de todas as transações  
✅ **Impressão de Cupons** — Gera cupons formatados 80mm (digital/físico)  
✅ **Comando Desativar** — Desativa o sistema quando sistema principal volta  

---

## 📁 Estrutura do Projeto

```
automationrecoveryvendaslanchonete/
├── src/
│   ├── server.js                 # Servidor Express principal
│   ├── webhook.js                # Processador de webhooks Evolution
│   ├── config/
│   │   └── env.js                # Carregamento de variáveis ambiente
│   └── services/
│       ├── evolutionClient.js    # Cliente da Evolution API
│       ├── rulesEngine.js        # Motor de regras e conversação
│       └── printerService.js     # Serviço de impressora de cupom
├── cupons/                       # 📁 Cupons digitais salvos
├── .env                          # Variáveis de ambiente (não versionar)
├── .env.example                  # Exemplo de .env
├── authorized_senders.json       # Lista de admins autorizados
├── consent.json                  # Registro de consentimento (opt-in/opt-out)
├── contatos-lanchonete.json      # Lista de contatos
├── package.json                  # Dependências
├── start.bat                     # Script para iniciar no Windows
└── README.md                     # Este arquivo
```

---

## 🚀 Instalação e Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```bash
copy .env.example .env
```

**Variáveis obrigatórias:**
- `EVOLUTION_API_URL` — URL da sua instância Evolution
- `EVOLUTION_API_KEY` — Token de autenticação
- `EVOLUTION_INSTANCE` — Nome da instância WhatsApp
- `PORT` — Porta do servidor (padrão: 3000)

### 3. Configurar Autorização

Edite `authorized_senders.json` para definir quem pode disparar alertas:

```json
{
  "admin": ["5527996087528"],
  "gerente": ["5527998241147"],
  "admin_tecnico": ["5527991111111"]
}
```

### 4. Iniciar o Servidor

```bash
npm start
```

Ou execute `start.bat` no Windows.

---

## 📋 Contatos

Edite `contatos-lanchonete.json` com a lista de clientes:

```json
[
  {
    "number": "5527996087528@s.whatsapp.net",
    "name": "Cliente Nome",
    "contactId": "5527996087528"
  }
]
```

---

## 🔐 Consentimento (Opt-in/Opt-out)

O sistema rastreia automaticamente quem quer ou não receber notificações em `consent.json`.

**Valores:**
- `opt_in` — Cliente quer receber
- `opt_out` — Cliente não quer receber
- `unknown` — Não respondeu

---

## 💬 Usando o Sistema

### 📢 Disparar Broadcast de Contingência

Apenas admins autorizados podem usar:

```
Envie: ALERTA
```

O sistema enviará mensagem de contingência para todos os contatos elegíveis, informando:
- Sistema caiu momentaneamente
- Instruções para refazer pedidos
- Opções de consentimento (SIM/NÃO)

### 🔴 Desativar Sistema de Recuperação

Quando o sistema principal volta a funcionar:

```
Envie: DESATIVAR
```

**O que acontece:**
- ✔️ Mensagem enviada para TODOS os clientes informando:
  - Sistema "Anota Aí" voltou a funcionar
  - Todos os pedidos feitos via WhatsApp estão OK e confirmados
  - Novos pedidos devem ser feitos no "Anota Aí"
- 🛑 Sistema de recuperação se desliga após 5 segundos

**Autorizado apenas para:** Admin, Gerente, Admin Técnico

### 🔄 Refazer Pedido — OPÇÃO A (Conversação)

Mais natural e interativa:

```
Cliente: refazer
Bot: Qual item deseja?
Cliente: x-tudo
Bot: Qual é seu endereço?
Cliente: rua x, 123
Bot: Forma de pagamento? (DINHEIRO, PIX ou CARTÃO)
Cliente: pix
Bot: ✅ Pedido confirmado!
```

**Estado:** Controlado por máquina de estados em `rulesEngine.js`

### 🔄 Refazer Pedido — OPÇÃO B (Tudo de Uma Vez)

Mais rápido:

```
Cliente: REFAZER x-tudo, rua x 123, pix
Bot: ✅ Pedido confirmado!
```

---

## 🖨️ Impressão de Cupons

Cada pedido registrado gera automaticamente um cupom formatado para **80mm**.

### Opção A (Estruturada)

Cupom com campos separados para item, endereço, pagamento:

```
═════════════════════════════════════════
        🍔 CASA DO HAMBÚRGUER 🍔
       SISTEMA DE CONTINGÊNCIA
═════════════════════════════════════════

📅 dd/mm/yyyy
⏰ HH:MM:SS
───────────────────────────────────────────

           PEDIDO #123456789
───────────────────────────────────────────

CLIENTE:
👤 Nome Cliente
📱 (27) 99999-9999
───────────────────────────────────────────

ITENS:
• X-Tudo

ENDEREÇO:
📍 Rua X, 123

PAGAMENTO:
💳 DINHEIRO
💵 Troco: R$ 50,00
───────────────────────────────────────────

        ⚠️ SISTEMA DE CONTINGÊNCIA
          Sistema principal indisponível

        Obrigado pela preferência!
                    🙏
═════════════════════════════════════════
```

### Opção B (Texto Livre)

Cupom com dados exatamente como cliente enviou:

```
═════════════════════════════════════════
        🍔 CASA DO HAMBÚRGUER 🍔
       SISTEMA DE CONTINGÊNCIA
═════════════════════════════════════════

PEDIDO:
X-Tudo, Pizza, Rua X 123, Dinheiro

        ⚠️ SISTEMA DE CONTINGÊNCIA
          Sistema principal indisponível

        Obrigado pela preferência!
                    🙏
═════════════════════════════════════════
```

### 📁 Localização dos Cupons

Os cupons são salvos em: `cupons/cupom_[ID]_[TIMESTAMP].txt`

**Modo simulação** (padrão): Salva em arquivo e exibe no console
**Modo real**: Pode ser configurado para enviar para impressora serial USB

Para ativar impressora real em `src/services/printerService.js`:

```javascript
const PRINTER_CONFIG = {
  simulationMode: false,  // Desativar simulacao
  outputPath: 'COM3'      // Porta serial da impressora
};
```

---

## ⚙️ Alternar Entre Opções A e B

Em `src/services/rulesEngine.js`:

```javascript
const CONFIG = {
  ENABLE_OPTION_A: true,   // Ativar conversacao por etapas
  ENABLE_OPTION_B: true,   // Ativar dados em uma mensagem
  ACTIVE_MODE: 'B'         // 'A' ou 'B' — qual usar agora
};
```

Mude `ACTIVE_MODE` para `'A'` ou `'B'` conforme necessário.

---

## 📊 Logs e Registros

### 📝 Pedidos Refazer

Todos os pedidos sao salvos em `pedidos_refazer.json`:

```json
{
  "id": 1707619200000,
  "from": "5527996087528@s.whatsapp.net",
  "numero": "5527996087528",
  "nome": "RyanSB",
  "item": "x-tudo",
  "endereco": "rua x, 123",
  "pagamento": "DINHEIRO",
  "troco": "sem troco",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

### 🗂️ Sessões Ativas (Opção A)

Gerenciadas em `refazer_sessions.json` — máquina de estados da conversacao.

---

## 🛡️ Anti-Bloqueio (Broadcast)

Estratégia de proteção contra rate limit do WhatsApp:

- 10 mensagens por lote
- Delay aleatorio de 12–20 segundos
- Pausa estrategica a cada 30 lotes
- Deteccao de rate limit (HTTP 429)
- Bloqueio interno de 6 horas entre broadcasts

---

## 🧪 Testes

### Para testar localmente:

**Opcao 1: Script automatico (Node.js)**

```bash
npm start      # Terminal 1
node test-webhook.js    # Terminal 2
```

**Opcao 2: Script interativo (PowerShell - Windows)**

```bash
npm start      # Terminal 1
.\test-webhook.ps1     # Terminal 2 (PowerShell)
```

**Opcao 3: Manual com Postman/cURL**

Veja [TESTING.md](TESTING.md) para todos os exemplos de payloads.

---

## 📡 Endpoints da API

| Metodo | Rota | Descricao |
|--------|------|-----------|
| `POST` | `/webhook` | Recebe mensagens do WhatsApp |
| `GET` | `/` | Status do servidor (health check) |

---

## 📌 Comandos e Palavras-Chave

| Comando | Funcao | Requer Autorizacao |
|---------|--------|-------------------|
| `ALERTA` | Dispara broadcast de contingencia | Sim |
| `DESATIVAR` | Desativa o sistema de recuperacao | Sim |
| `REFAZER` | Inicia processo de refazer pedido | Nao |
| `SIM` | Confirma consentimento para receber avisos | Nao |
| `NAO` | Recusa consentimento (opt-out) | Nao |

---

## 📌 Notas Operacionais

✔ Use `ALERTA` apenas em contingencia  
✔ Maximo 1–2 vezes por semana  
✔ Respeite opt-out automaticamente  
✔ Monitore logs para erros de envio  
✔ Cupons sao salvos automaticamente em `cupons/`  
✔ Use `DESATIVAR` quando sistema principal volta  

---

## 🔧 Desenvolvimento e Manutencao

### Fluxo de Processamento de Mensagens

1. **Webhook recebe message** → `server.js` → `webhook.js`
2. **Valida estrutura** → Remove mensagens bot proprio
3. **Passa para motor de regras** → `rulesEngine.js`
4. **Processa com prioridade:**
   - 🔴 **DESATIVAR** (encerra sistema)
   - 📢 **ALERTA** (broadcast para todos)
   - ✅ **SIM/NAO** (consentimento)
   - 🔄 **REFAZER** (inicia pedido)
5. **Registra pedido** → `OrderLogger.logOrder()`
6. **Gera cupom** → `printerService.printReceipt()`

### Estrutura de Dados do Pedido

```json
{
  "id": 1707619200000,
  "from": "5527996087528@s.whatsapp.net",
  "numero": "5527996087528",
  "nome": "RyanSB",
  "item": "x-tudo, pizza, rua flores 123, dinheiro",
  "endereco": null,
  "pagamento": "TEXTO_LIVRE",
  "troco": null,
  "timestamp": "2026-02-11T12:57:37.767Z"
}
```

### Vale Lembrar

Para conseguir os dados em `.json` dos chats de um WhatsApp, deve usar um script criado por mim, que atraves da Evolution API consegue capturar todos os dados.

---

## 📞 Suporte

- **Evolution API Docs:** [docs.evolution.api]
- **WhatsApp Business:** [business.facebook.com/wa]

---

**Ultima atualizacao:** 11 de fevereiro de 2026  
**Versao:** 2.0 (Com impressora de cupom e comando DESATIVAR)
