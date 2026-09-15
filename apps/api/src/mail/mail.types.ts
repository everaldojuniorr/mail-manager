export type OutboundMail = {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  text: string;
  html?: string;
};

export interface MailProvider {
  send(mail: OutboundMail): Promise<void>;
}
