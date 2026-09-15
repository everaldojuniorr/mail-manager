# Mail Manager

Webmail estilo Outlook (sidebar + lista + leitura) com API **NestJS** e front **React (Vite)**.

No desenvolvimento local as mensagens ficam no **PostgreSQL** (leve). Na VPS, use a pasta [`infra/`](infra/README.md) com **docker-mailserver** (SMTP/IMAP real) e `MAIL_PROVIDER=smtp`.

## Estrutura

```
mail-manager/
  apps/api              → NestJS + Prisma + JWT
  apps/web              → React + Vite
  infra/                → docker-mailserver (Fase 2 / VPS)
  docker/               → entrypoint + snippet Caddy (referência)
  scripts/deploy.sh     → blue/green na VPS (porta host 3010)
  docker-compose.yml    → produção (db + app-blue/green, sem Caddy)
  docker-compose.dev.yml → só Postgres (dev local)
```

## Pré-requisitos

- Node.js 20+
- Docker Desktop (ou Docker Engine) para o PostgreSQL

> Nesta máquina de desenvolvimento o Docker pode não estar no PATH.
> Instale/inicie o Docker e rode `docker compose -f docker-compose.dev.yml up -d db` antes das migrations.

## Subir local

```bash
# 1) ambiente
cp .env.example .env

# 2) banco
docker compose -f docker-compose.dev.yml up -d db

# 3) dependências
npm install

# 4) schema + seed
npm run db:generate
npm run db:migrate
npm run db:seed

# 5) API (3001) + Web (5173)
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). O Vite faz proxy de `/api` → `http://localhost:3001`.

**Login do seed:** `admin@financyexpert.com` / `admin123`  
(o domínio vem de `MAIL_DOMAIN=financyexpert.com` no `.env`)

### Fluxo útil para testar

1. Crie uma segunda conta em `/register` (ex.: usuário `alice` → `alice@financyexpert.com`)
2. De `admin@financyexpert.com`, envie um e-mail para `alice@financyexpert.com`
3. Entre como Alice e veja a mensagem na **Caixa de Entrada**

Na VPS, com docker-mailserver: use `MAIL_PROVIDER=smtp` e veja [infra/README.md](infra/README.md).

## Produção / VPS

Domínio do webmail: **webmail.financyexpert.com**.

| Item | Valor |
| --- | --- |
| DNS | registro **A** `webmail` → `2.25.158.41` |
| Clone | `/opt/mail-manager` |
| App (host) | `:3010` → container `:3000` (Caddy alcança via `host.docker.internal`; firewall bloqueia 3010 na internet) |
| Proxy TLS | Caddy do **financial-manager** → `host.docker.internal:3010` |
| Postgres | `127.0.0.1:5433` (não colide com o FM em `5432`) |

```bash
# No servidor
sudo mkdir -p /opt/mail-manager
sudo git clone <repo> /opt/mail-manager
cd /opt/mail-manager
cp .env.example .env   # ajuste JWT_SECRET e SMTP se necessário
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

O script faz blue/green em `app-blue` / `app-green` (ambos mapeiam `3010`; só um roda). Smoke em `/login` dentro do container e em `http://127.0.0.1:3010/login`. Em falha, restaura o slot anterior.

Não há Caddy neste compose: o HTTPS público fica no financial-manager (`docker/caddy/Caddyfile` + `extra_hosts: host.docker.internal`). Ver também [`docker/caddy/webmail.snippet`](docker/caddy/webmail.snippet).

Em produção o Nest serve a API **e** o build estático do React (`WEB_DIST`), com `VITE_API_URL` vazio (same-origin: `/auth`, `/folders`, `/messages`).

### Deploy automático (GitHub Actions)

Há um workflow em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) que, a cada push em `main` (após um job de build), conecta na VPS por SSH, atualiza o código em `/opt/mail-manager` e roda `scripts/deploy.sh`.

Configure em **Settings → Secrets and variables → Actions** (iguais ao financial-manager):

| Secret | Exemplo |
| --- | --- |
| `VPS_HOST` | `2.25.158.41` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | conteúdo da chave **privada** (`id_ed25519`) da VPS/deploy |
| `VPS_PORT` | `22` (opcional) |

A chave pública correspondente precisa estar em `~/.ssh/authorized_keys` do usuário da VPS.

## API (resumo)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Cria usuário + pastas padrão |
| POST | `/auth/login` | JWT |
| GET | `/folders` | Favoritos + conta com contagens |
| GET | `/folders/:id/messages` | Lista |
| GET | `/messages/:id` | Lê e marca como lida |
| POST | `/messages` | Envia ou salva rascunho |
| PATCH | `/messages/:id` | Move / flags |
| DELETE | `/messages/:id` | Soft delete → lixeira |

## Fase 2 (VPS)

Veja [infra/README.md](infra/README.md): DNS (MX/SPF/DKIM/DMARC), compose do mailserver e variáveis `MAIL_PROVIDER=smtp`.
