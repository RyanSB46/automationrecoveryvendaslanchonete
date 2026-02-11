#!/usr/bin/env node

/**
 * Ferramenta de teste para identificar portas seriais
 * Útil para encontrar a porta correta da impressora
 * 
 * Usar: node test-printer-port.js
 */

const SerialPort = require('serialport');

console.log('🔍 Procurando portas seriais disponíveis...\n');

SerialPort.SerialPort.list()
  .then(ports => {
    if (ports.length === 0) {
      console.log('❌ Nenhuma porta serial encontrada!');
      console.log('\n💡 Dicas:');
      console.log('   1. Verificar se a impressora está conectada');
      console.log('   2. Verificar se o driver está instalado');
      console.log('   3. Tentar reconectar a impressora');
      console.log('   4. Verificar Gerenciador de Dispositivos (Windows)');
      console.log('   5. Usar "ls /dev/tty*" no Linux');
      process.exit(1);
    }

    console.log(`✅ Encontradas ${ports.length} porta(s) serial(is):\n`);

    ports.forEach((port, index) => {
      console.log(`${index + 1}. Porta: ${port.path}`);
      console.log(`   Descrição: ${port.description || 'N/A'}`);
      console.log(`   Fabricante: ${port.manufacturer || 'N/A'}`);
      console.log(`   Número Série: ${port.serialNumber || 'N/A'}`);
      console.log('');
    });

    // Achar qual provavelmente é a impressora
    const printerPort = ports.find(p => 
      p.description?.toLowerCase().includes('usb') ||
      p.description?.toLowerCase().includes('serial') ||
      p.manufacturer?.toLowerCase().includes('usb') ||
      p.manufacturer?.toLowerCase().includes('prolific') ||
      p.manufacturer?.toLowerCase().includes('bematech') ||
      p.manufacturer?.toLowerCase().includes('daruma')
    );

    if (printerPort) {
      console.log(`🎯 Pressuposto: A impressora é a porta ${printerPort.path}`);
      console.log(`   Coloque ${printerPort.path} em PRINTER_SERIAL_PORT no .env\n`);
    } else {
      console.log('⚠️  Não há certeza qual porta é a impressora');
      console.log('   Tente cada uma das portas acima até encontrar a correta.\n');
    }

    console.log('📋 Para usar no arquivo .env:');
    console.log('   PRINTER_SERIAL_PORT=' + (printerPort?.path || 'PORTA_IDENTIFICADA'));
    console.log('   PRINTER_BAUD_RATE=115200');
    console.log('');

  })
  .catch(err => {
    console.error('❌ Erro ao listar portas:', err.message);
    console.log('\n💡 Certifique-se de que a biblioteca serialport está instalada:');
    console.log('   npm install serialport\n');
    process.exit(1);
  });
