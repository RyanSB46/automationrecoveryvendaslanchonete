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
│       └── rulesEngine.js        # Motor de regras e conversação
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
  "gerente": ["5527998241147"]
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

O sistema enviará mensagem de contingência para todos os contatos elegíveis.

### 🔄 Refazer Pedido — OPÇÃO A (Conversação)

Mais natural e interativa:

```
Cliente: refazer
Bot: Qual item deseja?
Cliente: x-tudo
Bot: Qual é seu endereço?
Cliente: rua x, 123
Bot: Será dinheiro ou PIX?
Cliente: pix
Bot: ✅ Pedido confirmado!
```

**Estado:** Controlado por máquina de estados em `rulesEngine.js`

### 🔄 Refazer Pedido — OPÇÃO B (Tudo de Uma Vez)

Mais rápido:

```
Cliente: refazer, x-tudo, rua x 123, pix
Bot: ✅ Pedido confirmado!
```

**Formato:** `refazer, item, endereço, pagamento`

---

## ⚙️ Alternar Entre Opções A e B

Em `src/services/rulesEngine.js`:

```javascript
const CONFIG = {
  ENABLE_OPTION_A: true,   // Ativar conversação por etapas
  ENABLE_OPTION_B: true,   // Ativar dados em uma mensagem
  ACTIVE_MODE: 'A'         // 'A' ou 'B' — qual usar agora
};
```

Mude `ACTIVE_MODE` para `'A'` ou `'B'` conforme necessário.

---

## 📊 Logs e Registros

### 📝 Pedidos Refazer

Todos os pedidos são salvos em `pedidos_refazer.json`:

```json
{
  "id": 1707619200000,
  "from": "5527996087528@s.whatsapp.net",
  "item": "x-tudo",
  "endereco": "rua x, 123",
  "pagamento": "PIX",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

### 🗂️ Sessões Ativas (Opção A)

Gerenciadas em `refazer_sessions.json` — máquina de estados da conversação.

---

## 🛡️ Anti-Bloqueio (Broadcast)

A especificação técnica completa está em docs/ (quando implementado).

**Estratégia resumida:**
- 10 mensagens por lote
- Delay aleatório de 12–20 segundos
- Pausa estratégica a cada 30 lotes
- Detecção de rate limit (HTTP 429)
- Bloqueio interno de 6 horas entre broadcasts

---

## 🔗 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/webhook/evolution` | Recebe mensagens do WhatsApp |
| `GET` | `/health` | Status do servidor |

---

## 📞 Suporte

- **Evolution API Docs:** [linkdadocs.evolution.api]
- **WhatsApp Business:** [business.facebook.com/wa]

---

## 📌 Notas Operacionais

✔ Use broadcast apenas em contingência  
✔ Máximo 1–2 vezes por semana  
✔ Respeite opt-out automaticamente  
✔ Monitore logs para erros de envio  

---

Vale lembrar que, para conseguir os dados em .json dos chats de um whatsapp, deve usar um script criado por mim, que atraves do evolutionAPI consegue capturar todos os dados.

**Última atualização:** 11 de fevereiro de 2026