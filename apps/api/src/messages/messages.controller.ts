import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('folders/:folderId/messages')
  listByFolder(
    @CurrentUser() user: AuthUser,
    @Param('folderId') folderId: string,
  ) {
    return this.messages.listByFolder(user.userId, folderId);
  }

  @Get('messages/:id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messages.getOne(user.userId, id);
  }

  @Post('messages')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMessageDto) {
    return this.messages.create(user.userId, user.email, dto);
  }

  @Patch('messages/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messages.update(user.userId, id, dto);
  }

  @Delete('messages/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.messages.softDelete(user.userId, id);
  }
}
