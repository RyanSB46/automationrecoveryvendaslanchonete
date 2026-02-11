# Script de Teste - Evolution Automation
# Windows PowerShell
# 
# Uso: .\test-webhook.ps1

# Cores
$success = 'Green'
$warning = 'Yellow'
$error_color = 'Red'
$info = 'Cyan'

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║  🧪 TESTE RÁPIDO - WEBHOOK EVOLUTION AUTOMATION           ║
║  Certifique que o servidor está rodando: npm start         ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor $success

$BASE_URL = "http://localhost:3000"

# Verificar se servidor está respondendo
Write-Host "📊 Verificando servidor..." -ForegroundColor $info
try {
  $health = Invoke-WebRequest -Uri $BASE_URL -Method GET -ErrorAction Stop
  Write-Host "✅ Servidor respondendo: $($health.StatusCode)" -ForegroundColor $success
} catch {
  Write-Host "❌ Erro: Servidor não está disponível em $BASE_URL" -ForegroundColor $error_color
  Write-Host "   Execute primeiro: npm start" -ForegroundColor $warning
  exit 1
}

Start-Sleep -Seconds 2

# Menu de opções
Write-Host "`n📋 Escolha um teste:" -ForegroundColor $info
Write-Host "1) 🚨 ALERTA - Admin Autorizado"
Write-Host "2) 🚫 ALERTA - Admin Não Autorizado"
Write-Host "3) 🔄 REFAZER - Opção A (Conversação)"
Write-Host "4) ⚡ REFAZER - Opção B (Tudo de Uma Vez)"
Write-Host "5) ✅ Consentimento - SIM"
Write-Host "6) ❌ Consentimento - NÃO"
Write-Host "7) 🔄 Executar Todos os Testes"
Write-Host ""

$choice = Read-Host "Digite sua escolha (1-7)"

function Send-Webhook {
  param(
    [string]$description,
    [object]$payload
  )
  
  Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $warning
  Write-Host "🧪 $description" -ForegroundColor $info
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor $warning
  
  try {
    $response = Invoke-WebRequest `
      -Uri "$BASE_URL/webhook" `
      -Method POST `
      -ContentType "application/json" `
      -Body ($payload | ConvertTo-Json -Depth 10) `
      -ErrorAction Stop
    
    Write-Host "✅ Resposta: $($response.StatusCode)" -ForegroundColor $success
    Write-Host ($response.Content | ConvertFrom-Json | ConvertTo-Json) -ForegroundColor $success
  } catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor $error_color
  }
  
  Start-Sleep -Seconds 2
}

# Payloads
$payload_alerta_admin = @{
  event = "messages.upsert"
  data = @{
    key = @{
      remoteJid = "5527996087528@s.whatsapp.net"
      fromMe = $false
    }
    message = @{
      conversation = "ALERTA"
    }
  }
}

$payload_alerta_nao_autorizado = @{
  event = "messages.upsert"
  data = @{
    key = @{
      remoteJid = "5527999999999@s.whatsapp.net"
      fromMe = $false
    }
    message = @{
      conversation = "ALERTA"
    }
  }
}

$payload_refazer_a_step1 = @{
  event = "messages.upsert"
  data = @{
    key = @{
      remoteJid = "5527991234567@s.whatsapp.net"
      fromMe = $false
    }
    message = @{
      conversation = "REFAZER"
    }
  }
}

$payload_refazer_b = @{
  event = "messages.upsert"
  data = @{
    key = @{
      remoteJid = "5527998765432@s.whatsapp.net"
      fromMe = $false
    }
    message = @{
      conversation = "REFAZER, HAMBÚRGUER SIMPLES, RUA CENTRAL 456, DINHEIRO"
    }
  }
}

$payload_consent_yes = @{
  event = "messages.upsert"
  data = @{
    key = @{
      remoteJid = "5527992222222@s.whatsapp.net"
      fromMe = $false
    }
    message = @{
      conversation = "SIM"
    }
  }
}

$payload_consent_no = @{
  event = "messages.upsert"
  data = @{
    key = @{
      remoteJid = "5527993333333@s.whatsapp.net"
      fromMe = $false
    }
    message = @{
      conversation = "NÃO"
    }
  }
}

# Executar testes
switch ($choice) {
  "1" {
    Send-Webhook "🚨 ALERTA - Admin Autorizado" $payload_alerta_admin
  }
  "2" {
    Send-Webhook "🚫 ALERTA - Admin Não Autorizado" $payload_alerta_nao_autorizado
  }
  "3" {
    Send-Webhook "🔄 REFAZER - Opção A Etapa 1" $payload_refazer_a_step1
    Write-Host "`n⚠️  Opção A é conversacional. Envie mais mensagens para continuar." -ForegroundColor $warning
  }
  "4" {
    Send-Webhook "⚡ REFAZER - Opção B (Tudo de Uma Vez)" $payload_refazer_b
  }
  "5" {
    Send-Webhook "✅ Consentimento - SIM" $payload_consent_yes
  }
  "6" {
    Send-Webhook "❌ Consentimento - NÃO" $payload_consent_no
  }
  "7" {
    Send-Webhook "🚨 ALERTA - Admin Autorizado" $payload_alerta_admin
    Send-Webhook "🚫 ALERTA - Admin Não Autorizado" $payload_alerta_nao_autorizado
    Send-Webhook "🔄 REFAZER - Opção A Etapa 1" $payload_refazer_a_step1
    Send-Webhook "⚡ REFAZER - Opção B" $payload_refazer_b
    Send-Webhook "✅ Consentimento - SIM" $payload_consent_yes
    Send-Webhook "❌ Consentimento - NÃO" $payload_consent_no
  }
  default {
    Write-Host "❌ Opção inválida" -ForegroundColor $error_color
  }
}

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║  ✅ TESTE FINALIZADO                                       ║
║  Verifique os arquivos:                                    ║
║  • pedidos_refazer.json (novos pedidos)                   ║
║  • refazer_sessions.json (sessões ativas)                 ║
║  • consent.json (consentimentos)                          ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor $success
