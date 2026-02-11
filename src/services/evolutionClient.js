/**
 * Cliente HTTP para comunicação com Evolution API
 * Responsável por enviar mensagens via WhatsApp
 */

const axios = require('axios');
const config = require('../config/env');

/**
 * Envia uma mensagem de texto via Evolution API
 * @param {string} number - Número do destinatário (sem @s.whatsapp.net)
 * @param {string} text - Texto da mensagem
 * @returns {Promise<boolean>} - true se enviou com sucesso
 */
async function sendTextMessage(number, text) {
  try {
    const url = `${config.evolution.host}/message/sendText/${config.evolution.instance}`;
    
    const payload = {
      number: number.replace('@s.whatsapp.net', ''), // garantir formato limpo
      text: text
    };

    const headers = {
      'Content-Type': 'application/json',
      'apikey': config.evolution.apiKey
    };

    const response = await axios.post(url, payload, { headers });

    if (response.status === 200 || response.status === 201) {
      return true;
    }

    console.error(`[EVOLUTION] ❌ Erro ao enviar mensagem: Status ${response.status}`);
    return false;

  } catch (error) {
    console.error('[EVOLUTION] ❌ Erro ao enviar mensagem:', error.message);
    return false;
  }
}

/**
 * Envia mensagens em lote com rate limit
 * @param {Array} contacts - Array de contatos { chatId, name, number }
 * @param {string} message - Mensagem a ser enviada
 * @param {number} batchSize - Tamanho do lote (padrão: 5)
 * @param {number} delayMs - Delay entre lotes em ms (padrão: 10000)
 */
async function sendBatchMessages(contacts, message, batchSize = 5, delayMs = 10000) {
  const total = contacts.length;
  let sent = 0;
  let failed = 0;

  console.log(`[SYSTEM] 📤 Iniciando envio em lotes (${batchSize} msgs a cada ${delayMs/1000}s)`);
  
  for (let i = 0; i < contacts.length; i += batchSize) {
    const batch = contacts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    console.log(`[SYSTEM] Enviando lote ${batchNumber} (${batch.length} mensagens)`);

    // Enviar todas as mensagens do lote em paralelo
    const promises = batch.map(contact => {
      // Aceitar tanto 'number' quanto 'chatId' (flexibilidade de formato)
      const recipient = contact.number || contact.chatId;
      
      return sendTextMessage(recipient, message)
        .then(success => {
          if (success) {
            console.log(`[SYSTEM] ✅ Enviado para ${contact.name || recipient}`);
            sent++;
          } else {
            console.log(`[SYSTEM] ❌ Falha ao enviar para ${contact.name || recipient}`);
            failed++;
          }
        });
    });

    await Promise.all(promises);

    // Aguardar antes do próximo lote (exceto no último)
    if (i + batchSize < contacts.length) {
      console.log(`[SYSTEM] ⏳ Aguardando ${delayMs/1000}s antes do próximo lote...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`[SYSTEM] 📊 Broadcast finalizado: ${sent} enviadas, ${failed} falhas`);
}

module.exports = {
  sendTextMessage,
  sendBatchMessages
};
