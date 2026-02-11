/**
 * Motor de regras e controle de consentimento
 * Gerencia autorização de ALERTA e opt-in/opt-out
 */

const fs = require('fs');
const path = require('path');
const evolutionClient = require('./evolutionClient');

// Caminhos dos arquivos
const AUTHORIZED_SENDERS_PATH = path.join(__dirname, '../../authorized_senders.json');
const CONTACTS_PATH = path.join(__dirname, '../../contatos-lanchonete.json');
const CONSENT_PATH = path.join(__dirname, '../../consent.json');

// Mensagem de contingência oficial
const CONTINGENCY_MESSAGE = `Nosso sistema caiu.

Se você fez algum pedido hoje, por favor refaça seu pedido por aqui no WhatsApp.

Se você não fez pedido, desconsidere esta mensagem.

👉 Para continuar recebendo este aviso em situações como essa, responda SIM ou apenas ignore.
👉 Para não receber mais mensagens, responda NÃO.`;

/**
 * Carrega arquivo JSON de forma segura
 */
function loadJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error) {
    console.error(`[SYSTEM] ❌ Erro ao carregar ${filePath}:`, error.message);
    return defaultValue;
  }
}

/**
 * Salva arquivo JSON de forma segura
 */
function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`[SYSTEM] ❌ Erro ao salvar ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Verifica se um número está autorizado a disparar ALERTA
 * @param {string} number - Número do remetente
 * @returns {boolean|string} - false ou o cargo do remetente
 */
function isAuthorizedSender(number) {
  const authorized = loadJSON(AUTHORIZED_SENDERS_PATH, {});
  
  // Limpar número para comparação (remover @s.whatsapp.net)
  const cleanNumber = number.replace('@s.whatsapp.net', '');
  
  for (const [role, numbers] of Object.entries(authorized)) {
    if (numbers.includes(cleanNumber)) {
      return role.toUpperCase();
    }
  }
  
  return false;
}

/**
 * Obtém o estado de consentimento de um contato
 * @param {string} number - Número do contato
 * @returns {string} - 'unknown', 'opt_in' ou 'opt_out'
 */
function getConsent(number) {
  const consent = loadJSON(CONSENT_PATH, {});
  const cleanNumber = number.replace('@s.whatsapp.net', '');
  return consent[cleanNumber] || 'unknown';
}

/**
 * Define o estado de consentimento de um contato
 * @param {string} number - Número do contato
 * @param {string} status - 'opt_in' ou 'opt_out'
 */
function setConsent(number, status) {
  const consent = loadJSON(CONSENT_PATH, {});
  const cleanNumber = number.replace('@s.whatsapp.net', '');
  consent[cleanNumber] = status;
  saveJSON(CONSENT_PATH, consent);
}

/**
 * Dispara o broadcast de contingência
 * Envia mensagem para todos os contatos elegíveis
 */
async function triggerAlertBroadcast() {
  console.log('[ADMIN] 🚨 ALERTA DISPARADO - Iniciando broadcast de contingência');
  
  // Carregar lista de contatos
  const allContacts = loadJSON(CONTACTS_PATH, []);
  
  if (allContacts.length === 0) {
    console.error('[SYSTEM] ❌ Nenhum contato encontrado em contatos-lanchonete.json');
    return;
  }
  
  console.log(`[SYSTEM] 📋 Total de contatos carregados: ${allContacts.length}`);
  
  // Filtrar contatos elegíveis (não opt-out)
  const eligibleContacts = allContacts.filter(contact => {
    // Aceitar tanto 'number' quanto 'chatId' ou 'contactId'
    const identifier = contact.number || contact.chatId || contact.contactId;
    const consent = getConsent(identifier);
    return consent !== 'opt_out';
  });
  
  console.log(`[SYSTEM] ✅ Contatos elegíveis após filtro de opt-out: ${eligibleContacts.length}`);
  
  if (eligibleContacts.length === 0) {
    console.log('[SYSTEM] ⚠️ Nenhum contato elegível para envio');
    return;
  }
  
  // Enviar mensagens em lote
  await evolutionClient.sendBatchMessages(eligibleContacts, CONTINGENCY_MESSAGE);
  
  console.log('[ADMIN] ✅ Broadcast de contingência finalizado');
}

/**
 * Processa mensagem recebida via webhook
 * @param {string} remoteJid - ID do chat remetente
 * @param {string} messageText - Texto da mensagem
 */
function processIncomingMessage(remoteJid, messageText) {
  // Normalizar texto
  const text = messageText.trim().toUpperCase();
  
  // PRIORIDADE 1: Comando ALERTA
  if (text === 'ALERTA') {
    const role = isAuthorizedSender(remoteJid);
    
    if (role) {
      console.log(`[ADMIN] 🔐 ALERTA autorizado por ${role} (${remoteJid})`);
      triggerAlertBroadcast().catch(err => {
        console.error('[ADMIN] ❌ Erro ao executar broadcast:', err.message);
      });
    } else {
      console.log(`[SECURITY] 🚫 ALERTA ignorado — remetente não autorizado (${remoteJid})`);
    }
    return;
  }
  
  // PRIORIDADE 2: Consentimento SIM
  if (text === 'SIM') {
    setConsent(remoteJid, 'opt_in');
    console.log(`[WEBHOOK] ✅ Resposta SIM recebida de ${remoteJid}`);
    return;
  }
  
  // PRIORIDADE 3: Consentimento NÃO
  if (text === 'NÃO' || text === 'NAO') {
    setConsent(remoteJid, 'opt_out');
    console.log(`[WEBHOOK] 🚫 Contato opt-out: ${remoteJid}`);
    return;
  }
  
  // Qualquer outro texto: ignorar completamente
  // (não logar para evitar poluição de logs)
}

module.exports = {
  isAuthorizedSender,
  getConsent,
  setConsent,
  triggerAlertBroadcast,
  processIncomingMessage
};
