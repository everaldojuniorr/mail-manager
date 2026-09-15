import { FolderKind } from '@prisma/client';

export const SYSTEM_FOLDERS: { kind: FolderKind; name: string }[] = [
  { kind: FolderKind.INBOX, name: 'Caixa de Entrada' },
  { kind: FolderKind.DRAFTS, name: 'Rascunhos' },
  { kind: FolderKind.SENT, name: 'Itens Enviados' },
  { kind: FolderKind.TRASH, name: 'Itens Excluídos' },
  { kind: FolderKind.JUNK, name: 'Lixo Eletrônico' },
  { kind: FolderKind.ARCHIVE, name: 'Arquivo Morto' },
];

export const FAVORITE_KINDS: FolderKind[] = [
  FolderKind.INBOX,
  FolderKind.SENT,
  FolderKind.DRAFTS,
];
