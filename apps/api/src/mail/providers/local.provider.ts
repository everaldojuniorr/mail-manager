import { Injectable, Logger } from '@nestjs/common';
import { MailProvider, OutboundMail } from '../mail.types';

/** Fase 1: não fala com SMTP real; só registra o envio. */
@Injectable()
export class LocalMailProvider implements MailProvider {
  private readonly logger = new Logger(LocalMailProvider.name);

  async send(mail: OutboundMail): Promise<void> {
    this.logger.log(
      `[local] Enviado de=${mail.from} para=${mail.to} assunto="${mail.subject}"`,
    );
  }
}
