# Mail Manager

Webmail estilo Outlook (sidebar + lista + leitura) com API **NestJS** e front **React (Vite)**.

No desenvolvimento local as mensagens ficam no **PostgreSQL** (leve). Na VPS, use a pasta [`infra/`](infra/README.md) com **docker-mailserver** (SMTP/IMAP real) e `MAIL_PROVIDER=smtp`.

## Estrutura

```
mail-manager/
  apps/api   → NestJS + Prisma + JWT
  apps/web   → React + Vite
  infra/     → docker-mailserver (Fase 2 / VPS)
  docker-compose.yml → só Postgres (dev)
```

## Pré-requisitos

- Node.js 20+
- Docker Desktop (ou Docker Engine) para o PostgreSQL

> Nesta máquina de desenvolvimento o Docker pode não estar no PATH.
> Instale/inicie o Docker e rode `docker compose up -d db` antes das migrations.

## Subir local

```bash
# 1) ambiente
cp .env.example .env

# 2) banco
docker compose up -d db

# 3) dependências
npm install

# 4) schema + seed
npm run db:generate
npm run db:migrate
npm run db:seed

# 5) API (3001) + Web (5173)
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

**Login do seed:** `admin@example.com` / `admin123`  
(o domínio vem de `MAIL_DOMAIN` no `.env`)

## Fluxo útil para testar

1. Crie uma segunda conta em `/register` (ex.: usuário `alice` → `alice@example.com`)
2. De `admin@example.com`, envie um e-mail para `alice@example.com`
3. Entre como Alice e veja a mensagem na **Caixa de Entrada**

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
