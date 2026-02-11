/**
 * Servidor principal do sistema de contingência
 * Inicializa Express e expõe endpoint de webhook
 */

const express = require('express');
const config = require('./config/env');
const webhookController = require('./webhook');

const app = express();

// Middleware para parsing de JSON
app.use(express.json());

// Rota de health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    service: 'Evolution Automation - Sistema de Contingência',
    version: '1.0.0'
  });
});

// Rota principal do webhook
app.post('/webhook', webhookController.handleWebhook);

// Iniciar servidor
const PORT = config.server.port;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 SISTEMA DE CONTINGÊNCIA - EVOLUTION API');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Servidor rodando na porta ${PORT}`);
  console.log(`  📥 Webhook: http://localhost:${PORT}/webhook`);
  console.log(`  🔗 Evolution: ${config.evolution.host}`);
  console.log(`  📱 Instância: ${config.evolution.instance}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Aguardando eventos...');
  console.log('');
});
