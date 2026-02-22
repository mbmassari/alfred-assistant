# Assistente Alfred — Checklist de Configuração

Documento de progresso para retomar a configuração do projeto.
Última atualização: 2026-02-20

---

## Status dos itens

- `[x]` Concluído
- `[ ]` Pendente

---

## Fase 1 — Secrets e personalização

- [x] Estrutura completa do projeto criada
- [x] `make init-secrets` executado (arquivos em `secrets/` com permissões `0600`)
- [x] `secrets/gateway_auth_token` gerado automaticamente (64-char hex)
- [x] `.gitignore` configurado (secrets e `.env` protegidos)
- [ ] Criar conta na [OpenRouter](https://openrouter.ai) e gerar uma API key
- [ ] Preencher `secrets/openrouter_api_key` com a chave real
- [ ] Preencher `nanobot/workspace/USER.md` com nome e preferências pessoais

> **Secrets opcionais** — preencher conforme for habilitando cada funcionalidade:
> `brave_search_api_key`, `email_imap_password`, `email_smtp_password`,
> `telegram_bot_token`, `google_calendar_key`, `instagram_access_token`, `linkedin_access_token`

---

## Fase 2 — Build e execução local

- [ ] `make build` — construir todas as imagens Docker (Gateway, Nanobot, Obsidian MCP, Portainer)
- [ ] `make up` — subir os 4 containers
- [ ] `make status` — verificar que todos os serviços estão saudáveis
- [ ] Testar Admin Panel localmente: `cd admin-panel && npm run dev` (acesso em `http://localhost:3000`)
- [ ] Fazer login com o token em `secrets/gateway_auth_token`
- [ ] Verificar status do Gateway e Nanobot no dashboard
- [ ] Enviar uma mensagem de teste para o Alfred

---

## Fase 3 — Exposição pública com Cloudflare Tunnel

Estratégia escolhida: **Cloudflare Tunnel** (seguro, gratuito, sem abrir portas no roteador)

- [ ] Criar conta em [cloudflare.com](https://cloudflare.com) (se ainda não tiver)
- [ ] Adicionar serviço `cloudflared` ao `docker-compose.yml` apontando para `alfred-gateway:8000`
- [ ] Criar o tunnel via `cloudflared tunnel create alfred`
- [ ] Configurar rota de DNS (`alfred.seudominio.com` ou subdomínio auto-gerado)
- [ ] Anotar a URL pública do tunnel (necessária na Fase 4)
- [ ] Testar acesso ao endpoint `https://<url-publica>/health` de fora da rede local

---

## Fase 4 — GitHub + Vercel

- [ ] `git init` na raiz do projeto
- [ ] `git add .` e revisar o que será commitado (confirmar que secrets NÃO estão incluídos)
- [ ] `git commit -m "chore: initial project setup"`
- [ ] Criar repositório no GitHub e fazer push
- [ ] Conectar repositório à Vercel (importar projeto, diretório raiz: `admin-panel/`)
- [ ] Configurar variável de ambiente na Vercel: `NEXT_PUBLIC_GATEWAY_URL=https://<url-publica>`
- [ ] Fazer deploy e verificar que o build passa

---

## Fase 5 — Validação final

- [ ] Acessar o Admin Panel publicado na Vercel
- [ ] Fazer login com o token em `secrets/gateway_auth_token`
- [ ] Verificar dashboard: Gateway `healthy`, Nanobot `healthy`
- [ ] Enviar uma mensagem para o Alfred e confirmar resposta
- [ ] Conferir log de auditoria na aba Audit Log

---

## Referência rápida — Comandos úteis

```bash
# Subir o ambiente
make up

# Ver logs em tempo real
make logs

# Ver apenas logs do gateway
make logs-gateway

# Ver apenas logs do nanobot
make logs-nanobot

# Status dos containers
make status

# Parar tudo
make down

# Reconstruir imagens do zero
make build-no-cache

# Gerar novo gateway_auth_token
make rotate-token

# Backup do vault do Obsidian
make backup

# Abrir shell no gateway
make shell-gateway

# Abrir shell no nanobot
make shell-nanobot
```

---

## Notas importantes

- O `gateway_auth_token` já gerado está em `secrets/gateway_auth_token` — guarde-o em local seguro
- Nunca commite arquivos da pasta `secrets/` (o `.gitignore` já os protege, mas revise antes do push)
- O modelo padrão do Nanobot está em `.env`: `openrouter/anthropic/claude-sonnet-4-20250514`
- O Admin Panel usa `output: 'standalone'` no Next.js — compatível com Vercel sem configuração extra
- Logs de todas as ações do Alfred ficam no banco SQLite do Gateway e visíveis na aba Audit Log
