# Guia DNS + docker-mailserver (Fase 2 — VPS)

Domínio de produção: **financyexpert.com**  
Hostname de e-mail: **mail.financyexpert.com** (`2.25.158.41`)

Este diretório sobe o **servidor de e-mail real** (SMTP/IMAP) com
[docker-mailserver](https://docker-mailserver.github.io/docker-mailserver/latest/).
Não use na máquina local fraca — só na VPS.

## DNS (Hostinger — já configurado)

| Tipo | Nome | Valor |
|------|------|--------|
| A | `mail` | `2.25.158.41` |
| MX | `@` | `mail.financyexpert.com` (prioridade 10) |
| TXT | `@` | `v=spf1 mx a:mail.financyexpert.com ip4:2.25.158.41 ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:postmaster@financyexpert.com` |
| TXT | `mail._domainkey` | *(gerar com o mailserver — DKIM)* |

PTR/rDNS (painel da VPS): `2.25.158.41` → `mail.financyexpert.com`.

## Subir o mailserver

```bash
cd infra
docker compose -f docker-compose.mailserver.yml up -d

curl -o setup.sh https://raw.githubusercontent.com/docker-mailserver/docker-mailserver/master/setup.sh
chmod +x setup.sh

./setup.sh email add admin@financyexpert.com 'SenhaForte'
./setup.sh config dkim
```

Cole o TXT DKIM gerado na zona DNS da Hostinger (`mail._domainkey`).

Libere no firewall da VPS: **25**, **587**, **993** (e 80/443 para TLS/webmail).

## Ligar a API NestJS ao SMTP/IMAP

No `.env` da API **na VPS**:

```env
MAIL_PROVIDER=smtp
MAIL_DOMAIN=financyexpert.com
SMTP_HOST=mail.financyexpert.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@financyexpert.com
SMTP_PASS=SenhaForte
IMAP_HOST=mail.financyexpert.com
IMAP_PORT=993
IMAP_SECURE=true
```

Em desenvolvimento local mantenha `MAIL_PROVIDER=local` (só Postgres).

## Checklist de produção

- [ ] MX/A/SPF/DKIM/DMARC publicados e propagados
- [ ] Porta 25 não bloqueada pelo provedor da VPS
- [ ] TLS (Let's Encrypt) no mailserver / reverse proxy do webmail
- [ ] Conta `admin@financyexpert.com` criada no DMS
- [ ] API com `MAIL_PROVIDER=smtp` e senha correta
- [ ] Teste de envio para Gmail/Outlook e recebimento de resposta
