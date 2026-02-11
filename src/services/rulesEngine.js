/**
 * Motor de regras e controle de consentimento
 * Gerencia autorização de ALERTA e opt-in/opt-out
 * Implementa Opção A (conversação) e Opção B (tudo de uma vez)
 */

const fs = require('fs');
const path = require('path');
const evolutionClient = require('./evolutionClient');
const printerService = require('./printerService');

// Caminhos dos arquivos
const AUTHORIZED_SENDERS_PATH = path.join(__dirname, '../../authorized_senders.json');
const CONTACTS_PATH = path.join(__dirname, '../../contatos-lanchonete.json');
const CONSENT_PATH = path.join(__dirname, '../../consent.json');
const SESSIONS_PATH = path.join(__dirname, '../../refazer_sessions.json');
const ORDERS_LOG_PATH = path.join(__dirname, '../../pedidos_refazer.json');

// Configuração de modo (Option A ou B)
const CONFIG = {
  ENABLE_OPTION_A: true,   // Ativar conversação por etapas
  ENABLE_OPTION_B: true,   // Ativar dados em uma mensagem
  ACTIVE_MODE: 'A'         // 'A' ou 'B' — qual usar por padrão
};

/**
 * Gera mensagem de contingência dinamicamente
 * Baseado no modo ativo (A ou B)
 */
function getContingencyMessage() {
  const baseMessage = `🚨 Nosso sistema caiu por um momento.

Se você fez algum pedido hoje, por favor *refaça seu pedido* aqui no WhatsApp.

Se você não fez pedido, desconsidere esta mensagem.`;

  let instructionMessage = '';
  
  if (CONFIG.ACTIVE_MODE === 'A' && CONFIG.ENABLE_OPTION_A) {
    instructionMessage = `
📝 *Como refazer seu pedido:*
Responda *UMA COISA POR VEZ* seguindo as instruções:

1️⃣ Digite: *REFAZER*
   (a gente vai perguntar o item)

2️⃣ Responda qual *ITEM* você quer
   (a gente vai perguntar o endereço)

3️⃣ Responda seu *ENDEREÇO*
   (a gente vai perguntar a forma de pagamento)

4️⃣ Escolha a forma de pagamento:
   *DINHEIRO*, *PIX* ou *CARTÃO*

✅ Pronto! Seu pedido será confirmado.`;
  } else if (CONFIG.ACTIVE_MODE === 'B' && CONFIG.ENABLE_OPTION_B) {
    instructionMessage = `
⚡ *Como refazer seu pedido (rápido):*
Digite REFAZER seguido de todas as informações:

Exemplo:
REFAZER xtudo sem banana, pizza gg, rua flores 123, dinheiro, troco pra 50

✅ Pronto! Seu pedido será confirmado na hora.`;
  }

  const consentMessage = `
👉 Para continuar recebendo esses avisos, responda *SIM* (ou deixe em branco)
👉 Para não receber mais, responda *NÃO*`;

  return baseMessage + instructionMessage + consentMessage;
}

// Mensagem de contingência (gerada dinamicamente)
let CONTINGENCY_MESSAGE = getContingencyMessage();

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
 * Gerencia sessões ativas do chatbot (Opção A)
 */
const SessionManager = {
  /**
   * Inicia uma nova sessão de refazer pedido
   */
  startSession(number) {
    const sessions = loadJSON(SESSIONS_PATH, {});
    sessions[number] = {
      step: 'awaiting_item',
      data: {},
      startedAt: new Date().toISOString()
    };
    saveJSON(SESSIONS_PATH, sessions);
    console.log(`[SESSION] 🆕 Sessão iniciada para ${number}`);
  },

  /**
   * Obter sessão ativa
   */
  getSession(number) {
    const sessions = loadJSON(SESSIONS_PATH, {});
    return sessions[number] || null;
  },

  /**
   * Atualizar sessão
   */
  updateSession(number, step, data = {}) {
    const sessions = loadJSON(SESSIONS_PATH, {});
    if (sessions[number]) {
      sessions[number].step = step;
      sessions[number].data = { ...sessions[number].data, ...data };
      saveJSON(SESSIONS_PATH, sessions);
    }
  },

  /**
   * Finalizar e remover sessão
   */
  completeSession(number) {
    const sessions = loadJSON(SESSIONS_PATH, {});
    delete sessions[number];
    saveJSON(SESSIONS_PATH, sessions);
    console.log(`[SESSION] ✅ Sessão finalizada para ${number}`);
  }
};

/**
 * Gerencia log de pedidos
 */
const OrderLogger = {
  /**
   * Registra um pedido completado
   * @param {string} from - Número do cliente (remoteJid)
   * @param {string} item - Item do pedido
   * @param {string} endereco - Endereço de entrega
   * @param {string} pagamento - Forma de pagamento (DINHEIRO, PIX, CARTÃO)
   * @param {string} troco - Informação sobre troco (opcional, apenas para DINHEIRO)
   */
  logOrder(from, item, endereco, pagamento, troco = null) {
    const orders = loadJSON(ORDERS_LOG_PATH, []);
    const orderId = Date.now();
    
    // Extrair número do cliente (remover @s.whatsapp.net)
    const clientNumber = from.replace('@s.whatsapp.net', '');
    
    // Carregar contato para pegar nome (se disponível)
    const allContacts = loadJSON(CONTACTS_PATH, []);
    let clientName = null;
    const contact = allContacts.find(c => 
      (c.number && c.number.includes(clientNumber)) || 
      (c.contactId && c.contactId === clientNumber)
    );
    if (contact && contact.name) {
      clientName = contact.name;
    }
    
    const order = {
      id: orderId,
      from: from,
      numero: clientNumber,  // Número para o entregador ligar
      nome: clientName,      // Nome do cliente (se disponível)
      item: item,
      endereco: endereco,
      pagamento: pagamento,
      troco: troco,          // Info de troco (se pagamento for DINHEIRO)
      timestamp: new Date().toISOString()
    };
    
    orders.push(order);
    saveJSON(ORDERS_LOG_PATH, orders);
    
    console.log(`[ORDER] 📝 Pedido registrado (#${orderId}): ${item} - ${pagamento}${troco ? ` - Troco: ${troco}` : ''}`);
    
    // Enviar para impressão (simulada ou real)
    printerService.printReceipt(order).catch(err => {
      console.error('[ORDER] ❌ Erro ao imprimir cupom:', err.message);
    });
    
    return order;
  }
};

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
  
  // Regenerar mensagem (em caso de mudança de CONFIG.ACTIVE_MODE)
  CONTINGENCY_MESSAGE = getContingencyMessage();
  console.log(`[ADMIN] 📢 Modo ativo: ${CONFIG.ACTIVE_MODE} - Instruções: ${CONFIG.ACTIVE_MODE === 'A' ? 'Conversação' : 'Tudo de uma vez'}`);
  
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
  
  // ============================================================================
  // CÁLCULO DINÂMICO DO TEMPO ESTIMADO (mesma fórmula do DESATIVAR)
  // ============================================================================
  
  const TEMPO_POR_CHAT_MS = 50;           // ~50ms por chat (ajustável)
  const BUFFER_SEGURANCA_MS = 5000;       // 5 segundos extras
  const MAXIMO_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos máximo
  
  const estimatedTimeMs = Math.min(
    (eligibleContacts.length * TEMPO_POR_CHAT_MS) + BUFFER_SEGURANCA_MS,
    MAXIMO_TIMEOUT_MS
  );
  
  const estimatedTimeSeconds = (estimatedTimeMs / 1000).toFixed(1);
  const estimatedTimeMinutes = (estimatedTimeMs / 1000 / 60).toFixed(2);
  const isAtMaximum = estimatedTimeMs >= MAXIMO_TIMEOUT_MS;
  
  console.log(`\n[SYSTEM] 📊 CÁLCULO DE TEMPO ESTIMADO:`);
  console.log(`[SYSTEM] • Chats elegíveis: ${eligibleContacts.length}`);
  console.log(`[SYSTEM] • Tempo por chat: 50ms`);
  console.log(`[SYSTEM] • Tempo estimado: ${estimatedTimeSeconds}s (${estimatedTimeMinutes} min)`);
  if (isAtMaximum) {
    console.log(`[SYSTEM] ⚠️  ATINGIU MÁXIMO: 30 minutos`);
  }
  
  // ============================================================================
  // FIRE & FORGET: Enfileira na Evolution API e não aguarda
  // ============================================================================
  
  console.log(`\n[SYSTEM] 📤 Enfileirando ${eligibleContacts.length} mensagens de alerta...`);
  const enqueueStartTime = Date.now();
  
  // NÃO aguarda - enfileira em background
  evolutionClient.sendBatchMessages(eligibleContacts, CONTINGENCY_MESSAGE)
    .catch(err => {
      console.error('[SYSTEM] ❌ Erro ao enfileirar broadcast de alerta:', err.message);
    });
  
  const enqueueEndTime = Date.now();
  const enqueueTime = (enqueueEndTime - enqueueStartTime);
  
  console.log(`[ADMIN] ✅ Mensagens de alerta enfileiradas em ${enqueueTime}ms`);
  console.log(`[SYSTEM] 📤 ${eligibleContacts.length} mensagens serão enviadas automaticamente`);
  console.log(`[SYSTEM] ⏱️  Evolution API processará tudo nos próximos ${estimatedTimeSeconds}s-30min\n`);
}

/**
 * Dispara o broadcast de desativação do sistema de recuperação
 * Informa que o sistema principal voltou a funcionar
 * Encerra o sistema após enviar mensagens
 */
async function triggerDeactivationBroadcast() {
  console.log('[ADMIN] 🔴 DESATIVAÇÃO INICIADA - Sistema de recuperação sendo desligado');
  
  // Carregar lista de contatos
  const allContacts = loadJSON(CONTACTS_PATH, []);
  
  if (allContacts.length === 0) {
    console.error('[SYSTEM] ❌ Nenhum contato encontrado em contatos-lanchonete.json');
    console.log('[SYSTEM] 🔴 ENCERRANDO SISTEMA...');
    setTimeout(() => process.exit(0), 1000);
    return;
  }
  
  console.log(`[SYSTEM] 📋 Total de contatos carregados: ${allContacts.length}`);
  
  // Filtrar contatos elegíveis (não opt-out)
  const eligibleContacts = allContacts.filter(contact => {
    const identifier = contact.number || contact.chatId || contact.contactId;
    const consent = getConsent(identifier);
    return consent !== 'opt_out';
  });
  
  console.log(`[SYSTEM] ✅ Contatos elegíveis: ${eligibleContacts.length}`);
  
  if (eligibleContacts.length === 0) {
    console.log('[SYSTEM] ⚠️ Nenhum contato elegível para envio');
    console.log('[SYSTEM] 🔴 ENCERRANDO SISTEMA...');
    setTimeout(() => process.exit(0), 1000);
    return;
  }
  
  // Mensagem de desativação
  const deactivationMessage = `✅ *SISTEMA VOLTA A FUNCIONAR!*

Bom notícia! O sistema da *Anota Aí* voltou a funcionar normalmente.

📌 *IMPORTANTE:*
Se você fez pedido por aqui, *fique tranquilo* — foi enviado e tá tudo certo! ✔️
Para *novos pedidos*, continue usando o *Anota Aí* normalmente.

Este sistema de recuperação vai ficar *OFFLINE* agora.

Obrigado por usar! 🙏`;

  // ============================================================================
  // CÁLCULO DINÂMICO DO TIMEOUT BASEADO NA QUANTIDADE REAL DE CHATS
  // ============================================================================
  
  /**
   * Fórmula dinâmica de timeout:
   * 
   * Cada batch (lote) processa 5 mensagens com delay de 10 segundos
   * Logo: 1000 chats = 200 lotes = ~40-45 minutos no máximo
   * 
   * Parâmetros configuráveis para ajuste futura (no dia do teste real):
   * - TEMPO_POR_CHAT_MS: tempo estimado por chat (atual: 50ms)
   * - BUFFER_SEGURANCA: margem extra (atual: 5 segundos)
   * - MAXIMO_TIMEOUT_MINUTOS: limite máximo (atual: 30 minutos)
   */
  
  const TEMPO_POR_CHAT_MS = 50;           // ~50ms por chat (ajustável)
  const BUFFER_SEGURANCA_MS = 5000;       // 5 segundos extras
  const MAXIMO_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos máximo
  
  // Calcular timeout dinâmico
  const calculatedTimeoutMs = Math.min(
    (eligibleContacts.length * TEMPO_POR_CHAT_MS) + BUFFER_SEGURANCA_MS,
    MAXIMO_TIMEOUT_MS
  );
  
  const calculatedTimeoutSeconds = (calculatedTimeoutMs / 1000).toFixed(1);
  const isAtMaximum = calculatedTimeoutMs >= MAXIMO_TIMEOUT_MS;
  
  console.log(`\n[SYSTEM] 📊 CÁLCULO DE TIMEOUT DINÂMICO:`);
  console.log(`[SYSTEM] • Chats elegíveis: ${eligibleContacts.length}`);
  console.log(`[SYSTEM] • Tempo por chat: ${TEMPO_POR_CHAT_MS}ms`);
  console.log(`[SYSTEM] • Timeout calculado: ${calculatedTimeoutSeconds}s`);
  if (isAtMaximum) {
    console.log(`[SYSTEM] ⚠️  ATINGIU MÁXIMO: 30 minutos (${MAXIMO_TIMEOUT_MS / 1000}s)`);
  }
  console.log(`[SYSTEM] • Tolerância para variações: ${(BUFFER_SEGURANCA_MS / 1000).toFixed(1)}s`);
  
  // ============================================================================
  // FIRE & FORGET: Enfileira na Evolution API e não aguarda
  // ============================================================================
  
  console.log(`\n[SYSTEM] 📤 Enfileirando ${eligibleContacts.length} mensagens...`);
  const enqueueStartTime = Date.now();
  
  // NÃO aguarda - enfileira em background
  evolutionClient.sendBatchMessages(eligibleContacts, deactivationMessage)
    .catch(err => {
      console.error('[SYSTEM] ❌ Erro ao enfileirar broadcast:', err.message);
    });
  
  const enqueueEndTime = Date.now();
  const enqueueTime = (enqueueEndTime - enqueueStartTime);
  
  console.log(`[ADMIN] ✅ Mensagens enfileiradas em ${enqueueTime}ms`);
  console.log(`[SYSTEM] 📤 ${eligibleContacts.length} mensagens serão enviadas automaticamente`);
  console.log(`[SYSTEM] ⏱️  Evolution API processará tudo nos próximos ${calculatedTimeoutSeconds}s-30min`);
  console.log(`[SYSTEM] 🔴 ENCERRANDO SERVIDOR EM ${(calculatedTimeoutMs / 1000).toFixed(1)}s...\n`);
  
  // Desligar após timeout calculado dinamicamente
  setTimeout(() => {
    console.log('[SYSTEM] 💤 Servidor offline - Evolution API continua processando em background');
    console.log('[SYSTEM] ✅ Todas as mensagens foram enfileiradas para entrega\n');
    process.exit(0);
  }, calculatedTimeoutMs);
}

/**
 * OPÇÃO A: Conversação por etapas (estado máquina)
 * Guia o cliente através de perguntas simples
 */
async function handleOptionA(remoteJid, messageText) {
  const text = messageText.trim().toUpperCase();
  let session = SessionManager.getSession(remoteJid);
  
  // Se não há sessão ativa, iniciar uma
  if (!session) {
    // Só iniciar se o texto é "REFAZER"
    if (text === 'REFAZER') {
      SessionManager.startSession(remoteJid);
      await evolutionClient.sendTextMessage(
        remoteJid,
        '✅ Ótimo! Vou ajudar você a refazer seu pedido.\n\n📝 Qual item deseja? (ex: X-TUDO, HAMBÚRGUER, etc)'
      );
      SessionManager.updateSession(remoteJid, 'awaiting_item');
      return;
    }
    return; // Ignorar se não é "REFAZER"
  }
  
  // Máquina de estados
  if (session.step === 'awaiting_item') {
    SessionManager.updateSession(remoteJid, 'awaiting_address', { item: messageText });
    await evolutionClient.sendTextMessage(
      remoteJid,
      `✅ Anotei: ${messageText}\n\n📍 Qual é seu endereço? (rua, número, etc)`
    );
    return;
  }
  
  if (session.step === 'awaiting_address') {
    SessionManager.updateSession(remoteJid, 'awaiting_payment', { endereco: messageText });
    await evolutionClient.sendTextMessage(
      remoteJid,
      `✅ Endereço anotado: ${messageText}\n\n💳 Forma de pagamento?\nDigite: DINHEIRO, PIX ou CARTÃO`
    );
    return;
  }
  
  if (session.step === 'awaiting_payment') {
    const paymentText = messageText.trim().toUpperCase();
    
    if (!['DINHEIRO', 'PIX', 'CARTÃO', 'CARTAO'].includes(paymentText)) {
      await evolutionClient.sendTextMessage(
        remoteJid,
        '❌ Desculpe, opção inválida. Digite: DINHEIRO, PIX ou CARTÃO'
      );
      return;
    }
    
    // Normalizar CARTÃO
    const paymentNormalized = paymentText === 'CARTAO' ? 'CARTÃO' : paymentText;
    
    // Se for DINHEIRO, perguntar sobre troco
    if (paymentNormalized === 'DINHEIRO') {
      SessionManager.updateSession(remoteJid, 'awaiting_change', { pagamento: paymentNormalized });
      await evolutionClient.sendTextMessage(
        remoteJid,
        `✅ Pagamento: DINHEIRO\n\n💵 Vai precisar de troco?\n\nResponda de forma livre:\n• "sem troco"\n• "troco pra 50" (ou qualquer valor)\n\nOu apenas digite "não"` 
      );
      return;
    }
    
    // Para PIX ou CARTÃO, pedir confirmação direta
    // Pedido completo!
    session = SessionManager.getSession(remoteJid);
    const order = OrderLogger.logOrder(
      remoteJid,
      session.data.item,
      session.data.endereco,
      paymentNormalized
    );
    
    await evolutionClient.sendTextMessage(
      remoteJid,
      `✅ Pedido confirmado!\n\n📋 Resumo:\n🍔 Item: ${session.data.item}\n📍 Endereço: ${session.data.endereco}\n💳 Pagamento: ${paymentNormalized}\n\n🆔 ID: #${order.id}\n\nObrigado! 🙏`
    );
    
    SessionManager.completeSession(remoteJid);
    return;
  }
  
  // Nova etapa: Pergunta sobre troco (só quando DINHEIRO)
  if (session.step === 'awaiting_change') {
    const changeText = messageText.trim();
    
    // Registrar a resposta sobre troco
    session = SessionManager.getSession(remoteJid);
    const order = OrderLogger.logOrder(
      remoteJid,
      session.data.item,
      session.data.endereco,
      session.data.pagamento,
      changeText  // passar info de troco
    );
    
    await evolutionClient.sendTextMessage(
      remoteJid,
      `✅ Pedido confirmado!\n\n📋 Resumo:\n🍔 Item: ${session.data.item}\n📍 Endereço: ${session.data.endereco}\n💳 Pagamento: ${session.data.pagamento}\n💵 Troco: ${changeText}\n\n🆔 ID: #${order.id}\n\nObrigado! 🙏`
    );
    
    SessionManager.completeSession(remoteJid);
    return;
  }
}

/**
 * OPÇÃO B: Tudo de uma vez
 * Cliente escreve tudo em uma mensagem livre
 * Formato: REFAZER [texto livre com todos os dados]
 * Exemplo: REFAZER xtudo sem banana, pizza gg, rua x 123, dinheiro
 */
async function handleOptionB(remoteJid, messageText) {
  const text = messageText.trim();
  const textUpper = text.toUpperCase();
  
  // Verificar se começa com REFAZER
  if (!textUpper.startsWith('REFAZER')) {
    return;
  }
  
  // Extrair tudo depois de "REFAZER"
  const pedidoCompleto = text.substring(7).trim(); // Remove "REFAZER" (7 caracteres)
  
  if (!pedidoCompleto) {
    await evolutionClient.sendTextMessage(
      remoteJid,
      `❌ Você precisa informar os dados do pedido.\n\nExemplo:\nREFAZER xtudo, pizza, rua x 123, dinheiro`
    );
    return;
  }
  
  // Salvar pedido exatamente como cliente escreveu
  const order = OrderLogger.logOrder(
    remoteJid, 
    pedidoCompleto,  // Todo o texto vai como "item"
    null,            // Não separamos endereço
    'TEXTO_LIVRE',   // Marca que é texto livre
    null             // Sem troco específico
  );
  
  await evolutionClient.sendTextMessage(
    remoteJid,
    `✅ Pedido recebido!\n\n📋 Detalhes:\n${pedidoCompleto}\n\n🆔 ID: #${order.id}\n\nObrigado! 🙏`
  );
  
  return;
}

/**
 * Processa mensagem recebida via webhook
 * @param {string} remoteJid - ID do chat remetente
 * @param {string} messageText - Texto da mensagem
 */
async function processIncomingMessage(remoteJid, messageText) {
  // Normalizar texto
  const text = messageText.trim().toUpperCase();
  
  // PRIORIDADE 0: Comando DESATIVAR
  if (text === 'DESATIVAR') {
    const role = isAuthorizedSender(remoteJid);
    
    if (role) {
      console.log(`[ADMIN] 🔐 DESATIVAR autorizado por ${role} (${remoteJid})`);
      triggerDeactivationBroadcast().catch(err => {
        console.error('[ADMIN] ❌ Erro ao executar desativação:', err.message);
      });
    } else {
      console.log(`[SECURITY] 🚫 DESATIVAR ignorado — remetente não autorizado (${remoteJid})`);
      // Responder ao usuário não autorizado
      await evolutionClient.sendTextMessage(
        remoteJid,
        '❌ Você não tem permissão para desativar o sistema.'
      ).catch(err => {
        console.error('[WEBHOOK] Erro ao enviar resposta:', err.message);
      });
    }
    return;
  }
  
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
  
  // PRIORIDADE 4: Sistema de REFAZER PEDIDOS
  // Opção exclusiva conforme CONFIG.ACTIVE_MODE
  
  if (CONFIG.ACTIVE_MODE === 'A' && CONFIG.ENABLE_OPTION_A) {
    // OPÇÃO A: Conversação interativa
    if (text.includes('REFAZER') || SessionManager.getSession(remoteJid)) {
      await handleOptionA(remoteJid, messageText);
      return;
    }
  } else if (CONFIG.ACTIVE_MODE === 'B' && CONFIG.ENABLE_OPTION_B) {
    // OPÇÃO B: Tudo de uma vez
    if (text.includes('REFAZER')) {
      await handleOptionB(remoteJid, messageText);
      return;
    }
  }
  
  // Qualquer outro texto: ignorar completamente
}

module.exports = {
  isAuthorizedSender,
  getConsent,
  setConsent,
  triggerAlertBroadcast,
  triggerDeactivationBroadcast,
  processIncomingMessage,
  SessionManager,
  OrderLogger,
  CONFIG
};
