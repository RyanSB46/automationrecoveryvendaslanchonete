/**
 * Script de teste quick para webhook
 * Node.js - Debug dos cenários
 * 
 * Uso: node test-webhook.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

async function test(name, payload) {
  try {
    console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}🧪 ${name}${colors.reset}`);
    console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    const response = await axios.post(`${BASE_URL}/webhook`, payload, {
      timeout: 5000
    });
    
    console.log(`${colors.green}✅ Resposta: ${JSON.stringify(response.data, null, 2)}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Erro: ${error.message}${colors.reset}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log(`${colors.green}
  ╔═══════════════════════════════════════════════════════════╗
  ║  🧪 TESTE WEBHOOK - EVOLUTION AUTOMATION                  ║
  ║  Certifique que o servidor está rodando: npm start         ║
  ╚═══════════════════════════════════════════════════════════╝
  ${colors.reset}`);

  // Test 1: Health Check
  try {
    console.log(`\n${colors.blue}📊 Verificando servidor...${colors.reset}`);
    const health = await axios.get(BASE_URL);
    console.log(`${colors.green}✅ Servidor respondendo:${colors.reset}`, health.data);
  } catch (error) {
    console.error(`${colors.red}❌ Servidor não está respondendo em ${BASE_URL}${colors.reset}`);
    process.exit(1);
  }

  await sleep(2000);

  // Test 2: ALERTA (Admin autorizado)
  await test('🚨 ALERTA - Admin Autorizado', {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5527996087528@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'ALERTA'
      }
    }
  });

  await sleep(2000);

  // Test 3: ALERTA (Admin NÃO autorizado)
  await test('🚫 ALERTA - Admin Não Autorizado', {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5527999999999@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'ALERTA'
      }
    }
  });

  await sleep(2000);

  // Test 4: REFAZER - Opção A (Etapa 1)
  await test('🔄 REFAZER - Opção A Etapa 1', {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5527991234567@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'REFAZER'
      }
    }
  });

  await sleep(2000);

  // Test 5: REFAZER - Opção A (Etapa 2)
  await test('🔄 REFAZER - Opção A Etapa 2 (Item)', {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5527991234567@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'X-TUDO'
      }
    }
  });

  await sleep(2000);

  // Test 6: REFAZER - Opção A (Etapa 3)
  await test('🔄 REFAZER - Opção A Etapa 3 (Endereço)', {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5527991234567@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'RUA FLORES 123'
      }
    }
  });

  await sleep(2000);

  // Test 7: REFAZER - Opção A (Etapa 4)
  await test('🔄 REFAZER - Opção A Etapa 4 (Pagamento)', {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5527991234567@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'PIX'
      }
    }
  });

  await sleep(2000);

  // Test 8: REFAZER - Opção B
  await test('⚡ REFAZER - Opção B (Tudo de Uma Vez)', {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5527998765432@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'REFAZER, HAMBÚRGUER SIMPLES, RUA CENTRAL 456, DINHEIRO'
      }
    }
  });

  await sleep(2000);

  // Test 9: Consentimento SIM
  await test('✅ Consentimento - SIM', {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5527992222222@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'SIM'
      }
    }
  });

  await sleep(2000);

  // Test 10: Consentimento NÃO
  await test('❌ Consentimento - NÃO', {
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5527993333333@s.whatsapp.net',
        fromMe: false
      },
      message: {
        conversation: 'NÃO'
      }
    }
  });

  console.log(`\n${colors.green}
  ╔═══════════════════════════════════════════════════════════╗
  ║  ✅ TESTES CONCLUÍDOS                                      ║
  ║  Verifique:                                                ║
  ║  • pedidos_refazer.json (novos pedidos)                   ║
  ║  • refazer_sessions.json (sessões)                        ║
  ║  • consent.json (consentimentos)                          ║
  ║  • Terminal (logs de execução)                            ║
  ╚═══════════════════════════════════════════════════════════╝
  ${colors.reset}`);
}

runTests().catch(err => {
  console.error(`${colors.red}Erro fatal: ${err.message}${colors.reset}`);
  process.exit(1);
});
