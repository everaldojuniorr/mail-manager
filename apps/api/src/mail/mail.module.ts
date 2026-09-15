import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { LocalMailProvider } from './providers/local.provider';
import { SmtpImapMailProvider } from './providers/smtp-imap.provider';

@Module({
  providers: [MailService, LocalMailProvider, SmtpImapMailProvider],
  exports: [MailService],
})
export class MailModule {}
