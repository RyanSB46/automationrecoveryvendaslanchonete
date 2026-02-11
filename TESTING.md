# 🧪 Guia de Testes End-to-End

Teste local completo do sistema de contingência com Evolution API.

---

## 📋 Pré-requisitos

✅ Node.js instalado  
✅ `.env` configurado com credenciais da Evolution API  
✅ Postman ou `curl` para simular webhooks  

---

## 🚀 1. Instalar e Iniciar

### Instalar dependências
```bash
npm install
```

### Iniciar o servidor
```bash
npm start
```

**Resultado esperado:**
```
═══════════════════════════════════════════════════════════
  🚀 SISTEMA DE CONTINGÊNCIA - EVOLUTION API
═══════════════════════════════════════════════════════════
  ✅ Servidor rodando na porta 3000
  📥 Webhook: http://localhost:3000/webhook
  🔗 Evolution: http://localhost:8080
  📱 Instância: aula
═══════════════════════════════════════════════════════════
  Aguardando eventos...
```

---

## 🧪 2. Testar Health Check

Verificar se o servidor está respondendo:

### Via Postman
- **Método:** `GET`
- **URL:** `http://localhost:3000`

### Via cURL
```bash
curl http://localhost:3000
```

**Resultado esperado:**
```json
{
  "status": "online",
  "service": "Evolution Automation - Sistema de Contingência",
  "version": "1.0.0"
}
```

---

## 💬 3. Testar Webhook (Simular mensagem do WhatsApp)

### Formato básico do payload
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527996087528@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "REFAZER"
    }
  }
}
```

---

## 🎯 Cenário 1: Testar ALERTA (Broadcast)

### Caso: Admin dispara ALERTA

**Payload:**
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527996087528@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "ALERTA"
    }
  }
}
```

### Via Postman
1. **Método:** `POST`
2. **URL:** `http://localhost:3000/webhook`
3. **Body** (JSON raw):
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527996087528@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "ALERTA"
    }
  }
}
```

### Via cURL
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","data":{"key":{"remoteJid":"5527996087528@s.whatsapp.net","fromMe":false},"message":{"conversation":"ALERTA"}}}'
```

**Log esperado no terminal:**
```
[ADMIN] 🔐 ALERTA autorizado por DONO (5527996087528@s.whatsapp.net)
[ADMIN] 🚨 ALERTA DISPARADO - Iniciando broadcast de contingência
[SYSTEM] 📋 Total de contatos carregados: 10
[SYSTEM] ✅ Contatos elegíveis após filtro de opt-out: 8
[SYSTEM] 📤 Iniciando envio em lotes (5 msgs a cada 10000s)
[SYSTEM] Enviando lote 1 (5 mensagens)
[SYSTEM] ✅ Enviado para Cliente Nome
...
```

---

## 🔄 Cenário 2: Opção A (Conversação por Etapas)

### Passo 1: Cliente envia "REFAZER"
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527991234567@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "REFAZER"
    }
  }
}
```

**Log esperado:**
```
[SESSION] 🆕 Sessão iniciada para 5527991234567@s.whatsapp.net
```

**Bot responde:**
```
✅ Ótimo! Vou ajudar você a refazer seu pedido.

📝 Qual item deseja? (ex: X-TUDO, HAMBÚRGUER, etc)
```

### Passo 2: Cliente envia item
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527991234567@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "X-TUDO"
    }
  }
}
```

**Bot responde:**
```
✅ Anotei: X-TUDO

📍 Qual é seu endereço? (rua, número, etc)
```

### Passo 3: Cliente envia endereço
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527991234567@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "RUA FLORES 123"
    }
  }
}
```

**Bot responde:**
```
✅ Endereço anotado: RUA FLORES 123

💳 Será DINHEIRO ou PIX?
```

### Passo 4: Cliente envia pagamento
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527991234567@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "PIX"
    }
  }
}
```

**Bot responde:**
```
✅ Pedido confirmado!

📋 Resumo:
🍔 Item: X-TUDO
📍 Endereço: RUA FLORES 123
💳 Pagamento: PIX

🆔 ID: #1707619200000

Obrigado! 🙏
```

**Log esperado:**
```
[SESSION] 🆕 Sessão iniciada para 5527991234567@s.whatsapp.net
[ORDER] 📝 Pedido registrado (#1707619200000): X-TUDO - PIX
[SESSION] ✅ Sessão finalizada para 5527991234567@s.whatsapp.net
```

---

## ⚡ Cenário 3: Opção B (Tudo de Uma Vez)

### Enviar com formato correto

```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527998765432@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "REFAZER, HAMBÚRGUER SIMPLES, RUA CENTRAL 456, DINHEIRO"
    }
  }
}
```

**Bot responde imediatamente:**
```
✅ Pedido recebido!

📋 Resumo:
🍔 Item: HAMBÚRGUER SIMPLES
📍 Endereço: RUA CENTRAL 456
💳 Pagamento: DINHEIRO

🆔 ID: #1707619300000

Obrigado! 🙏
```

**Log esperado:**
```
[ORDER] 📝 Pedido registrado (#1707619300000): HAMBÚRGUER SIMPLES - DINHEIRO
```

---

## 📊 Cenário 4: Verificar Logs

### Ver pedidos registrados
Abra `pedidos_refazer.json`:
```json
[
  {
    "id": 1707619200000,
    "from": "5527991234567@s.whatsapp.net",
    "item": "X-TUDO",
    "endereco": "RUA FLORES 123",
    "pagamento": "PIX",
    "timestamp": "2026-02-11T12:00:00.000Z"
  },
  {
    "id": 1707619300000,
    "from": "5527998765432@s.whatsapp.net",
    "item": "HAMBÚRGUER SIMPLES",
    "endereco": "RUA CENTRAL 456",
    "pagamento": "DINHEIRO",
    "timestamp": "2026-02-11T12:05:30.000Z"
  }
]
```

### Ver sessões ativas
Abra `refazer_sessions.json`:
```json
{
  "5527991111111@s.whatsapp.net": {
    "step": "awaiting_item",
    "data": {},
    "startedAt": "2026-02-11T12:10:00.000Z"
  }
}
```

### Ver consentimento
Abra `consent.json`:
```json
{
  "5527996087528": "opt_in",
  "5527998241147": "opt_out"
}
```

---

## 🔐 Cenário 5: Testar Consentimento (Opt-in/Opt-out)

### Cliente responde SIM
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527991234567@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "SIM"
    }
  }
}
```

**Log:**
```
[WEBHOOK] ✅ Resposta SIM recebida de 5527991234567@s.whatsapp.net
```

### Cliente responde NÃO
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527991234567@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "NÃO"
    }
  }
}
```

**Log:**
```
[WEBHOOK] 🚫 Contato opt-out: 5527991234567@s.whatsapp.net
```

---

## ⚠️ Cenário 6: Testar Erro (Admin não autorizado)

```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5527999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "ALERTA"
    }
  }
}
```

**Log:**
```
[SECURITY] 🚫 ALERTA ignorado — remetente não autorizado (5527999999999@s.whatsapp.net)
```

❌ **Nenhuma mensagem enviada** (sistema ignora)

---

## 🔧 Modo de Debug

Para aumentar verbosidade, edite `src/services/rulesEngine.js`:

```javascript
const CONFIG = {
  ENABLE_OPTION_A: true,
  ENABLE_OPTION_B: true,
  ACTIVE_MODE: 'A',
  DEBUG: true  // Adicione isto
};
```

---

## 📚 Postman Collection (Optional)

Salve como `postman_collection.json`:

```json
{
  "info": {
    "name": "Evolution Automation Tests",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:3000"
      }
    },
    {
      "name": "ALERTA - Admin",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/webhook",
        "body": {
          "mode": "raw",
          "raw": "{\"event\":\"messages.upsert\",\"data\":{\"key\":{\"remoteJid\":\"5527996087528@s.whatsapp.net\",\"fromMe\":false},\"message\":{\"conversation\":\"ALERTA\"}}}"
        }
      }
    },
    {
      "name": "REFAZER - Opção A",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/webhook",
        "body": {
          "mode": "raw",
          "raw": "{\"event\":\"messages.upsert\",\"data\":{\"key\":{\"remoteJid\":\"5527991234567@s.whatsapp.net\",\"fromMe\":false},\"message\":{\"conversation\":\"REFAZER\"}}}"
        }
      }
    },
    {
      "name": "REFAZER - Opção B",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/webhook",
        "body": {
          "mode": "raw",
          "raw": "{\"event\":\"messages.upsert\",\"data\":{\"key\":{\"remoteJid\":\"5527998765432@s.whatsapp.net\",\"fromMe\":false},\"message\":{\"conversation\":\"REFAZER, HAMBÚRGUER, RUA CENTRAL 456, PIX\"}}}"
        }
      }
    }
  ]
}
```

---

## ✅ Checklist de Testes

- [ ] Servidor inicia sem erros
- [ ] Health check retorna status "online"
- [ ] Admin consegue disparar ALERTA
- [ ] Não-admin recebe "não autorizado"
- [ ] Opção A completa a conversa (4 mensagens)
- [ ] Opção B aceita formato correto
- [ ] Pedidos são salvos em `pedidos_refazer.json`
- [ ] Sessões aparecem em `refazer_sessions.json`
- [ ] SIM/NÃO atualizam `consent.json`
- [ ] Logs aparecem no terminal com prefixo [ADMIN], [WEBHOOK], etc

---

**Última atualização:** 11 de fevereiro de 2026
