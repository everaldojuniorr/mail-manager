export type FolderKind =
  | 'INBOX'
  | 'SENT'
  | 'DRAFTS'
  | 'TRASH'
  | 'JUNK'
  | 'ARCHIVE';

export type Folder = {
  id: string;
  kind: FolderKind;
  name: string;
  total: number;
  unread: number;
  favorite: boolean;
};

export type MessageSummary = {
  id: string;
  fromAddr: string;
  toAddr: string;
  ccAddr: string;
  subject: string;
  preview: string;
  seen: boolean;
  flagged: boolean;
  createdAt: string;
  folderId: string;
};

export type Message = {
  id: string;
  fromAddr: string;
  toAddr: string;
  ccAddr: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  seen: boolean;
  flagged: boolean;
  createdAt: string;
  folderId: string;
};
