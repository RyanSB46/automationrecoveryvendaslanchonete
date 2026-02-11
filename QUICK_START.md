# ⚡ INÍCIO RÁPIDO - 5 Minutos

Teste tudo localmente em 5 minutos.

---

## 🚀 Passo 1: Instalar e Rodar

```bash
npm install
npm start
```

Você deve ver:
```
═══════════════════════════════════════════════════════════
  🚀 SISTEMA DE CONTINGÊNCIA - EVOLUTION API
  ✅ Servidor rodando na porta 3000
  📥 Webhook: http://localhost:3000/webhook
  Aguardando eventos...
```

---

## 🧪 Passo 2: Testar (escolha um)

### 🪟 Windows (PowerShell)
Abra outro terminal e execute:
```powershell
.\test-webhook.ps1
```
Menu interativo vai aparecer — escolha uma opção (1-7)

### 🐧 Linux/Mac (Node.js)
```bash
node test-webhook.js
```

### 📮 Postman/cURL (Manual)
[Ver TESTING.md para payloads](TESTING.md)

---

## 📊 Passo 3: Verificar Logs

### Local 1: Terminal (logs em tempo real)
```
[ADMIN] 🚨 ALERTA DISPARADO
[SESSION] 🆕 Sessão iniciada
[ORDER] 📝 Pedido registrado
[WEBHOOK] ✅ Resposta SIM recebida
```

### Local 2: arquivos JSON
| Arquivo | O que contém |
|---------|-------------|
| `pedidos_refazer.json` | Todos os pedidos salvos |
| `refazer_sessions.json` | Conversas em andamento |
| `consent.json` | Opt-in/opt-out dos clientes |

---

## 🎯 Cenários Rápidos

### ✅ Teste 1: Admin dispara ALERTA
```
Terminal: [ADMIN] 🔐 ALERTA autorizado
Resultado: Mensagens enviadas para contatos elegíveis
```

### ✅ Teste 2: Cliente refaz pedido (Opção A)
```
Cliente: "REFAZER" → Bot: "Qual item?"
Cliente: "X-TUDO" → Bot: "Qual endereço?"
Cliente: "Rua X 123" → Bot: "Dinheiro ou PIX?"
Cliente: "PIX" → Bot: "✅ Confirmado!" + Salva em pedidos_refazer.json
```

### ✅ Teste 3: Cliente refaz pedido (Opção B)
```
Cliente: "REFAZER, X-TUDO, RUA X 123, PIX"
Bot: "✅ Confirmado!" + Salva imediatamente
```

### ✅ Teste 4: Consentimento
```
Cliente: "SIM" → Salva em consent.json como "opt_in"
Cliente: "NÃO" → Salva em consent.json como "opt_out"
```

---

## 🔧 Configurar Rápido

**Adicionar admin autorizado:**
Edite `authorized_senders.json`:
```json
{
  "dono": ["seu_numero_aqui"],  // ex: 5527996087528
  "gerente": ["outro_numero"]
}
```

**Adicionar contatos:**
Edite `contatos-lanchonete.json`:
```json
[
  {
    "number": "5527996087528@s.whatsapp.net",
    "name": "Cliente",
    "contactId": "5527996087528"
  }
]
```

**Mudar modo (A ↔️ B):**
Edite `src/services/rulesEngine.js` linha 19:
```javascript
ACTIVE_MODE: 'A'  // mude para 'B'
```

---

## 📝 Checklist

Depois de testar, verifique:
- ✅ Servidor inicia sem erros
- ✅ Health check OK: `curl http://localhost:3000`
- ✅ ALERTA funciona e envia mensagens
- ✅ Pedidos são salvos em `pedidos_refazer.json`
- ✅ Sessões aparecem em `refazer_sessions.json`
- ✅ Consentimento salva em `consent.json`
- ✅ Logs aparecem no terminal

---

## 🆘 Problemas Comuns

### ❌ "ECONNREFUSED - Servidor não responde"
```bash
# Verifique se npm start está rodando
# Ou se Evolution API está em http://localhost:8080
```

### ❌ ".env não encontrado"
```bash
# Copie do exemplo:
cp .env.example .env
# e preencha com suas credenciais
```

### ❌ "Nenhum contato encontrado"
```bash
# Edite contatos-lanchonete.json com números reais
```

---

## 📚 Próximo Passo

Quando estiver pronto para produção:
1. Faça o deploy do servidor
2. Configure webhook na Evolution API apontando para sua URL
3. Teste com mensagens reais do WhatsApp
4. Monitore `pedidos_refazer.json` para pedidos

[Ver guia completo em TESTING.md](TESTING.md)

---

**Dúvidas?** Verifique o [README.md](README.md) completo.
