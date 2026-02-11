👀 Achei! **Cenário B - PROBLEMA CONFIRMADO!** 🚨

```javascript
async function sendBatchMessages(contacts, message, batchSize = 5, delayMs = 10000) {
  // ...
  
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    
    // ⏳ BLOQUEIA AQUI
    await Promise.all(promises); // Envia cada mensagem
    
    // ⏳ E BLOQUEIA AQUI TAMBÉM
    if (i + batchSize < contacts.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      // Aguarda 10 segundos antes do próximo lote
    }
  }
}
```

---

## 📊 Cálculo do Tempo Real com 1000 chats:

```
1000 chats ÷ 5 por lote = 200 lotes
200 lotes × 10 segundos = 2000 segundos = 33 MINUTOS!

Sem contar o tempo de HTTP request de cada mensagem...
Real: 40-45 MINUTOS com 1000 chats
```

**Se DESATIVAR for pressionado agora:**
```
1. Comando DESATIVAR
2. triggerDeactivationBroadcast() inicia
3. sendBatchMessages() começa loop pesado
4. 5 segundos passam...
5. process.exit(0) 🔴 DESLIGA
6. Apenas ~250 mensagens foram enviadas (5% do total!)
7. 750+ clientes NÃO recebem o aviso
```

---

## ✅ Solução: Não Bloquear o Servidor

Você tem 2 opções:

### **Opção 1: Fire & Forget (Recomendado para 1000+ chats)**
Envia em background, não aguarda:

```javascript
async function triggerDeactivationBroadcast() {
  console.log('[ADMIN] 🔴 DESATIVAÇÃO INICIADA');
  
  const allContacts = loadJSON(CONTACTS_PATH, []);
  const eligibleContacts = allContacts.filter(contact => {
    const identifier = contact.number || contact.chatId || contact.contactId;
    const consent = getConsent(identifier);
    return consent !== 'opt_out';
  });

  const deactivationMessage = `✅ *SISTEMA VOLTA A FUNCIONAR!* ...`;

  // ✅ NÃO ESPERA - ENVIA EM BACKGROUND
  evolutionClient.sendBatchMessages(eligibleContacts, deactivationMessage)
    .catch(err => console.error('[SYSTEM] ❌ Erro:', err));
  
  console.log(`[SYSTEM] 📤 ${eligibleContacts.length} mensagens enfileiradas`);
  console.log('[SYSTEM] 🔴 ENCERRANDO SISTEMA...');
  
  // Desliga rápido (apenas para flush de logs)
  setTimeout(() => process.exit(0), 1000);
}
```

**Problema:** Evolution API deve garantir que as mensagens são enviadas mesmo após seu servidor desligar.

---

### **Opção 2: Aguardar Tudo (Mais Seguro)**
Deixa terminar 100%, depois desliga:

```javascript
async function triggerDeactivationBroadcast() {
  console.log('[ADMIN] 🔴 DESATIVAÇÃO INICIADA');
  
  const allContacts = loadJSON(CONTACTS_PATH, []);
  const eligibleContacts = allContacts.filter(...);
  
  const deactivationMessage = `✅ *SISTEMA VOLTA A FUNCIONAR!* ...`;

  // ✅ AGUARDA TUDO
  const startTime = Date.now();
  await evolutionClient.sendBatchMessages(eligibleContacts, deactivationMessage);
  const endTime = Date.now();
  
  const totalSeconds = ((endTime - startTime) / 1000).toFixed(1);
  console.log(`[SYSTEM] ✅ Broadcast finalizado em ${totalSeconds}s`);
  console.log('[SYSTEM] 🔴 ENCERRANDO SISTEMA...');
  
  setTimeout(() => process.exit(0), 1000);
}
```

**Vantagem:** Garante 100% de entrega  
**Desvantagem:** Servidor fica "travado" por 40+ minutos

---

## 🤔 Qual você quer?

**A) Fire & Forget** (1-2 segundos, confiar na Evolution)  
→ `sendBatchMessages()` roda em background, servidor desliga rápido

**B) Aguardar Tudo** (40+ minutos, 100% de certeza)  
→ `sendBatchMessages()` bloqueia, espera terminar, depois desliga

---

**Minha recomendação para 1000+:** **Opção A** (Fire & Forget) + verificar com Evolution API se eles garantem entrega após servidor offline.

Qual você prefere? 👇