# Guia DNS + docker-mailserver (Fase 2 — VPS)

Este diretório sobe o **servidor de e-mail real** (SMTP/IMAP) com
[docker-mailserver](https://docker-mailserver.github.io/docker-mailserver/latest/).
Não use na máquina local fraca — só na VPS.

## Pré-requisitos

1. Domínio próprio (ex.: `seudominio.com`)
2. VPS com IP público e portas `25`, `587`, `993`, `80`, `443` abertas
3. DNS apontando para a VPS (abaixo)

## Registros DNS (substitua o domínio e o IP)

| Tipo | Nome | Valor |
|------|------|--------|
| A | `mail` | `IP_DA_VPS` |
| MX | `@` | `mail.seudominio.com` (prioridade 10) |
| TXT | `@` | `v=spf1 mx a:mail.seudominio.com ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:postmaster@seudominio.com` |
| TXT | `mail._domainkey` | *(cole o DKIM gerado pelo mailserver)* |

PTR/rDNS (no painel do provedor da VPS): IP → `mail.seudominio.com`.

## Subir o mailserver

```bash
cd infra
# edite mailserver.env e docker-compose.mailserver.yml (hostname/domainname)
docker compose -f docker-compose.mailserver.yml up -d

# criar conta de e-mail
./setup.sh email add voce@seudominio.com 'SenhaForte'
./setup.sh config dkim
```

O `setup.sh` oficial pode ser baixado:

```bash
curl -o setup.sh https://raw.githubusercontent.com/docker-mailserver/docker-mailserver/master/setup.sh
chmod +x setup.sh
```

## Ligar a API NestJS ao SMTP/IMAP

No `.env` da API (ou da VPS):

```env
MAIL_PROVIDER=smtp
MAIL_DOMAIN=seudominio.com
SMTP_HOST=mail.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=voce@seudominio.com
SMTP_PASS=SenhaForte
IMAP_HOST=mail.seudominio.com
IMAP_PORT=993
IMAP_SECURE=true
```

O adaptador já está em `apps/api/src/mail/providers/smtp-imap.provider.ts`
(`nodemailer` + `imapflow`). Com `MAIL_PROVIDER=local` (dev), a API só
grava no PostgreSQL.

## Checklist de produção

- [ ] MX/A/SPF/DKIM/DMARC publicados e propagados
- [ ] Porta 25 não bloqueada pelo provedor da VPS
- [ ] TLS (Let's Encrypt) no mailserver / reverse proxy do webmail
- [ ] Contas criadas no DMS alinhadas aos usuários do webmail
- [ ] Teste de envio para Gmail/Outlook e recebimento de resposta
