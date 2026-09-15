import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { FoldersModule } from '../folders/folders.module';

@Module({
  imports: [FoldersModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
