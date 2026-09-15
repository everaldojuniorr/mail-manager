import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { FoldersModule } from '../folders/folders.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [FoldersModule, MailModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
