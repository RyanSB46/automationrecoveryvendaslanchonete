/**
 * Controlador do webhook
 * Recebe eventos da Evolution API e processa mensagens
 */

const rulesEngine = require('./services/rulesEngine');

/**
 * Handler principal do webhook
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 */
function handleWebhook(req, res) {
  // Sempre responder 200 OK imediatamente
  res.status(200).json({ received: true });
  
  try {
    const payload = req.body;
    
    // Validar estrutura básica
    if (!payload || !payload.event) {
      return;
    }
    
    // Processar apenas evento MESSAGES_UPSERT
    if (payload.event !== 'messages.upsert' && payload.event !== 'MESSAGES_UPSERT') {
      return;
    }
    
    // Validar estrutura de dados
    const data = payload.data;
    if (!data || !data.key || !data.message) {
      return;
    }
    
    // Ignorar mensagens enviadas pelo próprio bot
    if (data.key.fromMe === true) {
      return;
    }
    
    // Extrair campos oficiais
    const remoteJid = data.key.remoteJid;
    const messageText = data.message.conversation || 
                       data.message.extendedTextMessage?.text;
    
    // Ignorar se não for mensagem de texto
    if (!messageText) {
      return;
    }
    
    // Processar mensagem através do motor de regras
    rulesEngine.processIncomingMessage(remoteJid, messageText);
    
  } catch (error) {
    console.error('[WEBHOOK] ❌ Erro ao processar webhook:', error.message);
  }
}

module.exports = {
  handleWebhook
};
