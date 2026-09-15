import { PrismaClient, FolderKind } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FOLDERS: { kind: FolderKind; name: string }[] = [
  { kind: FolderKind.INBOX, name: 'Caixa de Entrada' },
  { kind: FolderKind.DRAFTS, name: 'Rascunhos' },
  { kind: FolderKind.SENT, name: 'Itens Enviados' },
  { kind: FolderKind.TRASH, name: 'Itens Excluídos' },
  { kind: FolderKind.JUNK, name: 'Lixo Eletrônico' },
  { kind: FolderKind.ARCHIVE, name: 'Arquivo Morto' },
];

async function main() {
  const domain = process.env.MAIL_DOMAIN ?? 'financyexpert.com';
  const email = `admin@${domain}`;
  const passwordHash = await bcrypt.hash('admin123', 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      displayName: 'Admin',
      folders: { create: FOLDERS },
    },
    include: { folders: true },
  });

  const inbox = user.folders.find((f) => f.kind === FolderKind.INBOX);
  if (inbox) {
    const count = await prisma.message.count({ where: { userId: user.id } });
    if (count === 0) {
      await prisma.message.create({
        data: {
          userId: user.id,
          folderId: inbox.id,
          fromAddr: `bemvindo@${domain}`,
          toAddr: email,
          subject: 'Bem-vindo ao Mail Manager',
          bodyText:
            'Sua caixa local está pronta. Crie outra conta e envie um e-mail entre elas para testar a entrega interna.',
          seen: false,
        },
      });
    }
  }

  console.log(`Seed OK — login: ${email} / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
