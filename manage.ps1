# Script de Gerenciamento - Glowmaker3D Store
# Facilita o controle do site em Docker + Cloudflare Tunnel

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "update")]
    [string]$Action = "status"
)

$TunnelName = "glowmaker"
$TunnelID = "0c227bc0-d2b6-4796-9282-feaefc7ce8c1"
$CloudflaredPath = ".\cloudflared.exe"

function Show-Status {
    Write-Host "`n=== STATUS DO SITE ===" -ForegroundColor Cyan
    
    # Docker
    Write-Host "`n[Docker Container]" -ForegroundColor Yellow
    $container = docker ps --filter "name=site-loja" --format "{{.Status}}"
    if ($container) {
        Write-Host "✅ Rodando: $container" -ForegroundColor Green
    } else {
        Write-Host "❌ Não está rodando" -ForegroundColor Red
    }
    
    # Tunnel
    Write-Host "`n[Cloudflare Tunnel]" -ForegroundColor Yellow
    & $CloudflaredPath tunnel info $TunnelID 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tunnel configurado" -ForegroundColor Green
    }
    
    Write-Host "`n[URLs]" -ForegroundColor Yellow
    Write-Host "Local:  http://localhost:3000"
    Write-Host "Público: https://glowmaker3d.store"
    Write-Host "Público: https://www.glowmaker3d.store"
}

function Start-Site {
    Write-Host "`n=== INICIANDO SITE ===" -ForegroundColor Cyan
    
    # Iniciar Docker
    Write-Host "`n[1/2] Iniciando Docker..." -ForegroundColor Yellow
    docker-compose up -d
    
    # Iniciar Tunnel
    Write-Host "`n[2/2] Iniciando Cloudflare Tunnel..." -ForegroundColor Yellow
    Write-Host "Execute em outro terminal:" -ForegroundColor Green
    Write-Host "  .\cloudflared.exe tunnel run $TunnelName`n" -ForegroundColor White
}

function Stop-Site {
    Write-Host "`n=== PARANDO SITE ===" -ForegroundColor Cyan
    
    Write-Host "`n[1/2] Parando Docker..." -ForegroundColor Yellow
    docker-compose down
    
    Write-Host "`n[2/2] Para parar o Cloudflare Tunnel:" -ForegroundColor Yellow
    Write-Host "  Pressione Ctrl+C no terminal onde está rodando`n" -ForegroundColor White
}

function Restart-Site {
    Write-Host "`n=== REINICIANDO SITE ===" -ForegroundColor Cyan
    Stop-Site
    Start-Sleep -Seconds 2
    Start-Site
}

function Show-Logs {
    Write-Host "`n=== LOGS DO DOCKER ===" -ForegroundColor Cyan
    docker-compose logs -f --tail=50
}

function Update-Site {
    Write-Host "`n=== ATUALIZANDO SITE ===" -ForegroundColor Cyan
    
    Write-Host "`n[1/3] Parando containers..." -ForegroundColor Yellow
    docker-compose down
    
    Write-Host "`n[2/3] Fazendo rebuild..." -ForegroundColor Yellow
    docker-compose build --no-cache
    
    Write-Host "`n[3/3] Iniciando novamente..." -ForegroundColor Yellow
    docker-compose up -d
    
    Write-Host "`n✅ Atualização concluída!" -ForegroundColor Green
    Write-Host "Não esqueça de reiniciar o Cloudflare Tunnel se necessário.`n"
}

# Executar ação
switch ($Action) {
    "start"   { Start-Site }
    "stop"    { Stop-Site }
    "restart" { Restart-Site }
    "status"  { Show-Status }
    "logs"    { Show-Logs }
    "update"  { Update-Site }
}
