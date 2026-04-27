# Guia Rápido - Cloudflare Tunnel Configurado

## ✅ Status Atual

- **Tunnel ID:** 0c227bc0-d2b6-4796-9282-feaefc7ce8c1
- **Nome:** glowmaker
- **Domínio:** glowmaker3d.store e www.glowmaker3d.store
- **Container Docker:** site-loja rodando na porta 3000
- **Conexões:** 4 datacenters ativos (gru02, gru08, gru11, gru20)

## 🌐 Seu Site

- https://glowmaker3d.store
- https://www.glowmaker3d.store

**Nota:** DNS pode levar 5-15 minutos para propagar. Teste depois desse tempo!

## 🎮 Comandos Úteis

### Iniciar o tunnel (modo teste)
```powershell
cd C:\Users\Admin\Desktop\Projetos\site-loja
.\cloudflared.exe tunnel run glowmaker
```

### Parar o tunnel
`Ctrl + C` no terminal

### Instalar como serviço do Windows (recomendado para produção)
```powershell
# 1. Instalar o serviço
.\cloudflared.exe service install

# 2. Iniciar o serviço
.\cloudflared.exe service start

# 3. Ver status
Get-Service cloudflared

# 4. Parar o serviço
.\cloudflared.exe service stop

# 5. Desinstalar o serviço
.\cloudflared.exe service uninstall
```

### Ver info do tunnel
```powershell
.\cloudflared.exe tunnel info 0c227bc0-d2b6-4796-9282-feaefc7ce8c1
```

### Listar todos os tunnels
```powershell
.\cloudflared.exe tunnel list
```

## 🐳 Docker

### Ver logs do container
```powershell
docker-compose logs -f site-loja
```

### Reiniciar container
```powershell
docker-compose restart
```

### Rebuild após mudanças no código
```powershell
docker-compose down
docker-compose up -d --build
```

## 📁 Arquivos Importantes

- **Config do tunnel:** `C:\Users\Admin\.cloudflared\config.yml`
- **Credenciais:** `C:\Users\Admin\.cloudflared\0c227bc0-d2b6-4796-9282-feaefc7ce8c1.json`
- **Executável:** `C:\Users\Admin\Desktop\Projetos\site-loja\cloudflared.exe`
- **Docker Compose:** `C:\Users\Admin\Desktop\Projetos\site-loja\docker-compose.yml`

## 🔒 Segurança

- ✅ SSL/TLS automático via Cloudflare
- ✅ Porta 3000 não está exposta publicamente
- ✅ Todo tráfego passa pela rede da Cloudflare
- ✅ Proteção DDoS automática

## 🆘 Troubleshooting

### Site não carrega
1. Verifique se o tunnel está rodando: `.\cloudflared.exe tunnel list`
2. Verifique se o Docker está rodando: `docker ps`
3. Aguarde o DNS propagar (5-15 min)
4. Teste localmente: `http://localhost:3000`

### Reiniciar tudo
```powershell
# Parar tunnel (Ctrl+C no terminal dele)
# Reiniciar Docker
docker-compose restart
# Iniciar tunnel novamente
.\cloudflared.exe tunnel run glowmaker
```

### Ver logs em tempo real
```powershell
# Logs do Docker
docker-compose logs -f

# Logs do Cloudflare (no terminal onde está rodando)
```

## 🎉 Pronto!

Seu site está configurado e rodando! Quando o DNS propagar, estará acessível em:
- https://glowmaker3d.store
- https://www.glowmaker3d.store

**Recomendação:** Instale o cloudflared como serviço do Windows para que reinicie automaticamente se o PC reiniciar.
