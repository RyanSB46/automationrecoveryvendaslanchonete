/**
 * Configuração de variáveis de ambiente
 * Carrega e valida todas as variáveis necessárias
 */

require('dotenv').config();

// Validação: verificar se todas as variáveis obrigatórias existem
const requiredEnvVars = [
  'EVOLUTION_HOST',
  'EVOLUTION_API_KEY',
  'EVOLUTION_INSTANCE'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[CONFIG] ❌ Variável obrigatória ausente: ${envVar}`);
    process.exit(1);
  }
}

module.exports = {
  evolution: {
    host: process.env.EVOLUTION_HOST,
    apiKey: process.env.EVOLUTION_API_KEY,
    instance: process.env.EVOLUTION_INSTANCE
  },
  server: {
    port: process.env.PORT || 3000
  }
};
