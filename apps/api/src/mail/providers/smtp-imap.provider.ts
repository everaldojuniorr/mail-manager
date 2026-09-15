import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { MailProvider, OutboundMail } from '../mail.types';

/**
 * Fase 2 (VPS): envia via SMTP e expõe helper IMAP para sync futuro.
 * Ativo quando MAIL_PROVIDER=smtp.
 */
@Injectable()
export class SmtpImapMailProvider implements MailProvider {
  private readonly logger = new Logger(SmtpImapMailProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(mail: OutboundMail): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const secure = this.config.get<string>('SMTP_SECURE') === 'true';
    const user = this.config.get<string>('SMTP_USER') ?? mail.from;
    const pass = this.config.get<string>('SMTP_PASS') ?? '';

    if (!host) {
      throw new Error('SMTP_HOST não configurado para MAIL_PROVIDER=smtp.');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: pass ? { user, pass } : undefined,
      // DMS em lab usa certificado self-signed; Let's Encrypt pode reativar a verificação.
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: mail.from,
      to: mail.to,
      cc: mail.cc,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    this.logger.log(`[smtp] Enviado para=${mail.to} assunto="${mail.subject}"`);
  }

  /** Exemplo de conexão IMAP — útil para sync na VPS. */
  async createImapClient(user: string, pass: string) {
    const host = this.config.get<string>('IMAP_HOST');
    const port = Number(this.config.get<string>('IMAP_PORT', '993'));
    const secure = this.config.get<string>('IMAP_SECURE', 'true') !== 'false';
    if (!host) {
      throw new Error('IMAP_HOST não configurado.');
    }
    const client = new ImapFlow({
      host,
      port,
      secure,
      auth: { user, pass },
      logger: false,
    });
    await client.connect();
    return client;
  }
}
