import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalMailProvider } from './providers/local.provider';
import { SmtpImapMailProvider } from './providers/smtp-imap.provider';
import { MailProvider, OutboundMail } from './mail.types';

@Injectable()
export class MailService implements MailProvider {
  private readonly provider: MailProvider;

  constructor(
    config: ConfigService,
    local: LocalMailProvider,
    smtp: SmtpImapMailProvider,
  ) {
    const mode = (config.get<string>('MAIL_PROVIDER') ?? 'local').toLowerCase();
    this.provider = mode === 'smtp' ? smtp : local;
  }

  send(mail: OutboundMail): Promise<void> {
    return this.provider.send(mail);
  }
}
