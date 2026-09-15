import { Injectable, NotFoundException } from '@nestjs/common';
import { FolderKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FAVORITE_KINDS } from './folder.constants';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    const withCounts = await Promise.all(
      folders.map(async (folder) => {
        const [total, unread] = await Promise.all([
          this.prisma.message.count({ where: { folderId: folder.id } }),
          this.prisma.message.count({
            where: { folderId: folder.id, seen: false },
          }),
        ]);
        return {
          id: folder.id,
          kind: folder.kind,
          name: folder.name,
          total,
          unread,
          favorite: FAVORITE_KINDS.includes(folder.kind),
        };
      }),
    );

    const order: FolderKind[] = [
      FolderKind.INBOX,
      FolderKind.DRAFTS,
      FolderKind.SENT,
      FolderKind.TRASH,
      FolderKind.JUNK,
      FolderKind.ARCHIVE,
    ];

    withCounts.sort(
      (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind),
    );

    return {
      favorites: withCounts.filter((f) => f.favorite),
      account: withCounts,
    };
  }

  async getById(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new NotFoundException('Pasta não encontrada.');
    return folder;
  }

  async getByKind(userId: string, kind: FolderKind) {
    const folder = await this.prisma.folder.findFirst({
      where: { userId, kind },
    });
    if (!folder) throw new NotFoundException(`Pasta ${kind} não encontrada.`);
    return folder;
  }
}
