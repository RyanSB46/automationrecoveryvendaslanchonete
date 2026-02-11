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
  },
  printer: {
    // Modo de operação
    simulationMode: process.env.PRINTER_SIMULATION_MODE !== 'false', // true = arquivo, false = serial
    
    // Configuração de porta serial
    serialPort: process.env.PRINTER_SERIAL_PORT || 'COM3', // COM3, COM4, /dev/ttyUSB0, etc
    baudRate: parseInt(process.env.PRINTER_BAUD_RATE || '115200'), // Velocidade da porta
    
    // Configuração de impressora
    width: parseInt(process.env.PRINTER_WIDTH || '40'), // 40 caracteres para 80mm
    timeout: parseInt(process.env.PRINTER_TIMEOUT || '5000'), // 5 segundos timeout
    
    // Diretório de simulação
    simulationOutputPath: process.env.PRINTER_SIMULATION_PATH || './cupons',
    
    // ESC/POS Settings
    fontSize: process.env.PRINTER_FONT_SIZE || 'normal', // 'small', 'normal', 'large'
    codepage: process.env.PRINTER_CODEPAGE || 'CP1252' // Página de código da impressora
  }
};
