# 🐳 Guia de Deploy com Docker + Cloudflare Tunnel

Este guia explica como fazer self-hosting do site-loja usando Docker e Cloudflare Tunnel.

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Conta Cloudflare (gratuita)
- Domínio registrado (pode ser em qualquer registrar, mas precisa usar os nameservers da Cloudflare)
- Credenciais do Supabase (você já tem)

## 🚀 Passo 1: Configurar Variáveis de Ambiente

**IMPORTANTE:** As variáveis `NEXT_PUBLIC_*` do Next.js são embutidas no código durante o **build**. Por isso, elas precisam estar disponíveis tanto durante o build quanto no runtime.

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais reais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-real
```

**Como funciona:**
- O Docker Compose lê o arquivo `.env`
- Passa as variáveis como **build arguments** durante o build da imagem
- Também as injeta como **environment variables** no runtime
- Isso garante que o Supabase funcione corretamente no container

## 🔧 Passo 2: Atualizar next.config.ts

Adicione a configuração de output standalone:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // <-- ADICIONE ESTA LINHA
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
```

## 🐳 Passo 3: Build e Executar com Docker

### Opção A: Docker Compose (Recomendado)

```bash
# Build e iniciar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Rebuild após mudanças
docker-compose up -d --build
```

### Opção B: Docker puro

```bash
# Build da imagem
docker build -t site-loja .

# Executar container
docker run -d \
  --name site-loja \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave \
  site-loja

# Ver logs
docker logs -f site-loja
```

## 🌐 Passo 4: Configurar Cloudflare Tunnel (Sem Login/Autenticação)

**IMPORTANTE:** Para um site de loja público, você **NÃO precisa** do Cloudflare Access (aquela tela que pede para configurar login). 

- ✅ **Cloudflare Tunnel** = conecta seu servidor à internet (o que você quer)
- ❌ **Cloudflare Access** = adiciona login/autenticação (só para sites privados)

**Use apenas linha de comando** conforme abaixo. Ignore qualquer tela do dashboard web que peça para configurar autenticação.

### 4.1 Instalar cloudflared

**Windows:**
```powershell
# Download do instalador
Invoke-WebRequest -Uri https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -OutFile cloudflared.exe

# Ou use Chocolatey
choco install cloudflared
```

**Linux:**
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### 4.2 Autenticar com Cloudflare

```bash
cloudflared tunnel login
```

Isso abrirá um browser para você fazer login na Cloudflare.

### 4.3 Criar o Tunnel

```bash
# Criar tunnel (substitua "minha-loja" pelo nome que preferir)
cloudflared tunnel create minha-loja

# Isso retornará um UUID, anote ele!
# Exemplo: Created tunnel minha-loja with id a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 4.4 Configurar DNS

Após comprar o domínio e configurá-lo na Cloudflare:

```bash
# Substitua pelos seus valores:
# - UUID_DO_TUNNEL: o ID que você anotou
# - seudominio.com: seu domínio real
cloudflared tunnel route dns UUID_DO_TUNNEL seudominio.com
```

Exemplo:
```bash
cloudflared tunnel route dns a1b2c3d4-e5f6-7890-abcd-ef1234567890 minhaloja.com
```

### 4.5 Criar Arquivo de Configuração

Crie o arquivo `config.yml` no diretório do cloudflared:

**Windows:** `C:\Users\SEU_USUARIO\.cloudflared\config.yml`  
**Linux:** `~/.cloudflared/config.yml`

Conteúdo:
```yaml
tunnel: UUID_DO_TUNNEL
credentials-file: C:\Users\SEU_USUARIO\.cloudflared\UUID_DO_TUNNEL.json

ingress:
  - hostname: seudominio.com
    service: http://localhost:3000
  - hostname: www.seudominio.com
    service: http://localhost:3000
  - service: http_status:404
```

**Exemplo real:**
```yaml
tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890
credentials-file: C:\Users\Admin\.cloudflared\a1b2c3d4-e5f6-7890-abcd-ef1234567890.json

ingress:
  - hostname: minhaloja.com
    service: http://localhost:3000
  - hostname: www.minhaloja.com
    service: http://localhost:3000
  - service: http_status:404
```

### 4.6 Executar o Tunnel

**Modo teste:**
```bash
cloudflared tunnel run minha-loja
```

**Como serviço (Windows):**
```powershell
cloudflared service install
cloudflared service start
```

**Como serviço (Linux):**
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 4.7 Verificar o Tunnel

```bash
# Ver status
cloudflared tunnel info UUID_DO_TUNNEL

# Ver lista de tunnels
cloudflared tunnel list
```

**✅ PRONTO!** Seu site agora está público em `https://seudominio.com`

**Nota:** Se o dashboard da Cloudflare mostrar uma tela pedindo para configurar "Application" ou "Access Policy", você pode **ignorar** completamente. Isso é apenas para sites privados que precisam de login. Seu tunnel já está funcionando via linha de comando!

### 📝 Alternativa: Usar Dashboard Web (Opcional)

Se preferir usar o dashboard web da Cloudflare em vez de linha de comando:

1. Acesse: `https://one.dash.cloudflare.com/`
2. Vá em: **Access** > **Tunnels** > **Create a tunnel**
3. Escolha **"Cloudflared"**
4. Dê um nome (ex: "minha-loja")
5. Copie o comando de instalação que aparece
6. Execute no seu servidor

**⚠️ IMPORTANTE na tela do screenshot que você mostrou:**
- Quando aparecer "Nomeie seu aplicativo", você pode clicar em **Skip** ou fechar
- OU preencher e na próxima tela escolher **"Allow"** sem regras de autenticação
- Basicamente: **pule toda a parte de Access/Login**
- Configure apenas: hostname (seudominio.com) → Service (http://localhost:3000)

O Access só é necessário se você quiser que usuários façam login antes de acessar o site. Para uma loja pública, isso não faz sentido!

## ✅ Verificação

1. Acesse `http://localhost:3000` - deve funcionar localmente
2. Acesse `https://seudominio.com` - deve funcionar via Cloudflare Tunnel
3. O certificado SSL é automático via Cloudflare!

## 🔄 Atualizar a Aplicação

Após fazer mudanças no código:

```bash
# Rebuild e reiniciar
docker-compose down
docker-compose up -d --build

# Ou com Docker puro
docker stop site-loja
docker rm site-loja
docker build -t site-loja .
docker run -d --name site-loja -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  site-loja
```

## 📊 Monitoramento

```bash
# Logs do Docker
docker-compose logs -f

# Logs do Cloudflare Tunnel
# Windows: Event Viewer > Windows Logs > Application
# Linux:
sudo journalctl -u cloudflared -f

# Status da aplicação
curl http://localhost:3000
```

## 🔒 Segurança

- ✅ Nunca commite o arquivo `.env`
- ✅ Use `.env.example` apenas como template
- ✅ Mantenha as credenciais do Supabase seguras
- ✅ O Cloudflare Tunnel não expõe sua porta 3000 diretamente
- ✅ SSL/TLS automático via Cloudflare

## 🆘 Troubleshooting

### Container não inicia
```bash
docker-compose logs site-loja
```

### Erro "Your project's URL and API key are required"

Este erro ocorre quando as variáveis do Supabase não estão disponíveis durante o build. Solução:

1. Verifique se o arquivo `.env` existe e tem as credenciais corretas:
```bash
cat .env  # Linux/Mac
type .env # Windows
```

2. Faça rebuild completo:
```bash
docker-compose down
docker-compose up -d --build
```

3. Se ainda não funcionar, tente build sem cache:
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Tunnel não conecta
```bash
cloudflared tunnel info UUID_DO_TUNNEL
```

### Erro de build
Certifique-se que adicionou `output: 'standalone'` no `next.config.ts`

### Domínio não resolve
- Verifique se os nameservers estão apontando para Cloudflare
- Pode levar até 48h para propagar DNS
- Teste: `nslookup seudominio.com`

### Site pede login/autenticação

Se o seu site está pedindo login quando deveria ser público:

1. **Você configurou Cloudflare Access sem querer**
2. Solução: No dashboard da Cloudflare:
   - Vá em **Access** > **Applications**
   - Encontre sua aplicação e clique nela
   - Vá em **Policies** e delete todas, ou
   - Delete a aplicação inteira
3. O tunnel continuará funcionando sem o Access
4. Alternativamente, recrie o tunnel via linha de comando seguindo o guia acima

### Tunnel funciona mas só localmente

- Verifique se executou `cloudflared tunnel route dns UUID seudominio.com`
- Confirme que o tunnel está rodando: `cloudflared tunnel info UUID`
- Verifique o arquivo config.yml se o hostname está correto

## 💡 Dicas

- Use Docker Compose para facilitar gerenciamento
- Configure restart: unless-stopped para o container reiniciar automaticamente
- O Cloudflare Tunnel funciona mesmo atrás de NAT/firewall
- Você pode usar um domínio gratuito temporário do Cloudflare para testar antes de comprar

## 📚 Recursos Adicionais

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Next.js Docker Docs](https://nextjs.org/docs/deployment#docker-image)
- [Supabase Docs](https://supabase.com/docs)
