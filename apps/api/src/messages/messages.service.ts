import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FolderKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FoldersService } from '../folders/folders.service';
import { MailService } from '../mail/mail.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly folders: FoldersService,
    private readonly mail: MailService,
  ) {}

  async listByFolder(userId: string, folderId: string) {
    await this.folders.getById(userId, folderId);
    const messages = await this.prisma.message.findMany({
      where: { userId, folderId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fromAddr: true,
        toAddr: true,
        ccAddr: true,
        subject: true,
        bodyText: true,
        seen: true,
        flagged: true,
        createdAt: true,
        folderId: true,
      },
    });
    return messages.map((m) => ({
      ...m,
      preview: m.bodyText.slice(0, 120),
    }));
  }

  async getOne(userId: string, id: string) {
    const message = await this.prisma.message.findFirst({
      where: { id, userId },
    });
    if (!message) throw new NotFoundException('Mensagem não encontrada.');

    if (!message.seen) {
      return this.prisma.message.update({
        where: { id },
        data: { seen: true },
      });
    }
    return message;
  }

  async create(userId: string, email: string, dto: CreateMessageDto) {
    const isDraft = dto.draft === true;
    const targetKind = isDraft ? FolderKind.DRAFTS : FolderKind.SENT;
    const folder = await this.folders.getByKind(userId, targetKind);

    if (!isDraft && !dto.to?.trim()) {
      throw new BadRequestException('Informe o destinatário.');
    }

    const message = await this.prisma.message.create({
      data: {
        userId,
        folderId: folder.id,
        fromAddr: email,
        toAddr: dto.to?.trim() ?? '',
        ccAddr: dto.cc?.trim() ?? '',
        subject: dto.subject?.trim() || '(sem assunto)',
        bodyText: dto.bodyText?.trim() ?? '',
        bodyHtml: dto.bodyHtml?.trim() ?? '',
        seen: true,
      },
    });

    if (!isDraft) {
      await this.mail.send({
        from: email,
        to: message.toAddr,
        cc: message.ccAddr || undefined,
        subject: message.subject,
        text: message.bodyText,
        html: message.bodyHtml || undefined,
      });

      // Entrega local: se o destinatário existir no mesmo domínio, cria na INBOX
      await this.deliverLocalInbound(message.toAddr, {
        fromAddr: email,
        toAddr: message.toAddr,
        ccAddr: message.ccAddr,
        subject: message.subject,
        bodyText: message.bodyText,
        bodyHtml: message.bodyHtml,
      });
    }

    return message;
  }

  async update(userId: string, id: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.findFirst({
      where: { id, userId },
    });
    if (!message) throw new NotFoundException('Mensagem não encontrada.');

    let folderId = message.folderId;
    if (dto.folderId) {
      await this.folders.getById(userId, dto.folderId);
      folderId = dto.folderId;
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        folderId,
        seen: dto.seen ?? undefined,
        flagged: dto.flagged ?? undefined,
      },
    });
  }

  async softDelete(userId: string, id: string) {
    const message = await this.prisma.message.findFirst({
      where: { id, userId },
      include: { folder: true },
    });
    if (!message) throw new NotFoundException('Mensagem não encontrada.');

    if (message.folder.kind === FolderKind.TRASH) {
      await this.prisma.message.delete({ where: { id } });
      return { deleted: true };
    }

    const trash = await this.folders.getByKind(userId, FolderKind.TRASH);
    await this.prisma.message.update({
      where: { id },
      data: { folderId: trash.id },
    });
    return { movedToTrash: true };
  }

  private async deliverLocalInbound(
    toAddr: string,
    payload: {
      fromAddr: string;
      toAddr: string;
      ccAddr: string;
      subject: string;
      bodyText: string;
      bodyHtml: string;
    },
  ) {
    const recipient = await this.prisma.user.findUnique({
      where: { email: toAddr.toLowerCase() },
    });
    if (!recipient) return;

    const inbox = await this.folders.getByKind(recipient.id, FolderKind.INBOX);
    await this.prisma.message.create({
      data: {
        userId: recipient.id,
        folderId: inbox.id,
        fromAddr: payload.fromAddr,
        toAddr: payload.toAddr,
        ccAddr: payload.ccAddr,
        subject: payload.subject,
        bodyText: payload.bodyText,
        bodyHtml: payload.bodyHtml,
        seen: false,
      },
    });
  }
}
