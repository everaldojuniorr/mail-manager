import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Inbox,
  LogOut,
  Mail,
  Pencil,
  Plane,
  Plus,
  Send,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import type { Folder, FolderKind, Message, MessageSummary } from '../types';
import { Composer } from '../components/Composer';

const ICONS: Record<FolderKind, typeof Inbox> = {
  INBOX: Inbox,
  SENT: Plane,
  DRAFTS: Pencil,
  TRASH: Trash2,
  JUNK: ShieldAlert,
  ARCHIVE: Archive,
};

export function MailShell() {
  const { user, logout } = useAuth();
  const [favorites, setFavorites] = useState<Folder[]>([]);
  const [account, setAccount] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [composing, setComposing] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [error, setError] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  const selectedFolder = useMemo(
    () => account.find((f) => f.id === selectedFolderId) ?? null,
    [account, selectedFolderId],
  );

  const refreshFolders = useCallback(async () => {
    const data = await api.get<{ favorites: Folder[]; account: Folder[] }>(
      '/folders',
    );
    setFavorites(data.favorites);
    setAccount(data.account);
    setSelectedFolderId((prev) => {
      if (prev && data.account.some((f) => f.id === prev)) return prev;
      const inbox = data.account.find((f) => f.kind === 'INBOX');
      return inbox?.id ?? data.account[0]?.id ?? null;
    });
  }, []);

  const refreshMessages = useCallback(async (folderId: string) => {
    setLoadingList(true);
    try {
      const list = await api.get<MessageSummary[]>(
        `/folders/${folderId}/messages`,
      );
      setMessages(list);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshFolders().catch((err) =>
      setError(err instanceof Error ? err.message : 'Erro ao carregar pastas'),
    );
  }, [refreshFolders]);

  useEffect(() => {
    if (!selectedFolderId) return;
    setSelectedId(null);
    setMessage(null);
    setComposing(false);
    refreshMessages(selectedFolderId).catch((err) =>
      setError(err instanceof Error ? err.message : 'Erro ao carregar lista'),
    );
  }, [selectedFolderId, refreshMessages]);

  async function openMessage(id: string) {
    setComposing(false);
    setReplyTo(null);
    setSelectedId(id);
    const full = await api.get<Message>(`/messages/${id}`);
    setMessage(full);
    await refreshFolders();
    if (selectedFolderId) await refreshMessages(selectedFolderId);
  }

  async function handleDelete() {
    if (!selectedId || !selectedFolderId) return;
    await api.delete(`/messages/${selectedId}`);
    setSelectedId(null);
    setMessage(null);
    await refreshFolders();
    await refreshMessages(selectedFolderId);
  }

  async function handleArchive() {
    if (!selectedId || !selectedFolderId) return;
    const archive = account.find((f) => f.kind === 'ARCHIVE');
    if (!archive) return;
    await api.patch(`/messages/${selectedId}`, { folderId: archive.id });
    setSelectedId(null);
    setMessage(null);
    await refreshFolders();
    await refreshMessages(selectedFolderId);
  }

  function startCompose() {
    setReplyTo(null);
    setComposing(true);
    setSelectedId(null);
    setMessage(null);
  }

  function startReply() {
    if (!message) return;
    setReplyTo(message);
    setComposing(true);
  }

  async function onComposerDone() {
    setComposing(false);
    setReplyTo(null);
    await refreshFolders();
    if (selectedFolderId) await refreshMessages(selectedFolderId);
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Mail size={18} />
          <div>
            <strong>Mail Manager</strong>
            <div className="muted tiny">{user?.email}</div>
          </div>
        </div>

        <button className="primary full" onClick={startCompose}>
          <Plus size={16} /> Novo e-mail
        </button>

        <nav className="folder-group">
          <div className="group-title">Favoritos</div>
          {favorites.map((folder) => (
            <FolderButton
              key={`fav-${folder.id}`}
              folder={folder}
              active={folder.id === selectedFolderId}
              onClick={() => setSelectedFolderId(folder.id)}
            />
          ))}
        </nav>

        <nav className="folder-group">
          <div className="group-title">{user?.email ?? 'Conta'}</div>
          {account.map((folder) => (
            <FolderButton
              key={folder.id}
              folder={folder}
              active={folder.id === selectedFolderId}
              onClick={() => setSelectedFolderId(folder.id)}
            />
          ))}
        </nav>

        <button className="ghost logout" onClick={logout}>
          <LogOut size={16} /> Sair
        </button>
      </aside>

      <section className="list-pane">
        <header className="pane-header">
          <h2>{selectedFolder?.name ?? 'Mensagens'}</h2>
          {error && <span className="error inline">{error}</span>}
        </header>
        {loadingList ? (
          <div className="empty">Carregando…</div>
        ) : messages.length === 0 ? (
          <div className="empty">Nenhuma mensagem nesta pasta.</div>
        ) : (
          <ul className="message-list">
            {messages.map((item) => (
              <li key={item.id}>
                <button
                  className={`message-row ${item.id === selectedId ? 'active' : ''} ${item.seen ? '' : 'unread'}`}
                  onClick={() => openMessage(item.id).catch(console.error)}
                >
                  <div className="row-top">
                    <span className="from">
                      {selectedFolder?.kind === 'SENT' ||
                      selectedFolder?.kind === 'DRAFTS'
                        ? item.toAddr || '(sem destinatário)'
                        : item.fromAddr}
                    </span>
                    <time>
                      {new Date(item.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <div className="subject">{item.subject}</div>
                  <div className="preview">{item.preview}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="reading-pane">
        {composing ? (
          <Composer
            replyTo={replyTo}
            onCancel={() => {
              setComposing(false);
              setReplyTo(null);
            }}
            onDone={onComposerDone}
          />
        ) : message ? (
          <article className="message-view">
            <header>
              <h2>{message.subject}</h2>
              <div className="meta">
                <div>
                  <strong>De:</strong> {message.fromAddr}
                </div>
                <div>
                  <strong>Para:</strong> {message.toAddr}
                </div>
                {message.ccAddr && (
                  <div>
                    <strong>Cc:</strong> {message.ccAddr}
                  </div>
                )}
                <div className="muted">
                  {new Date(message.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="actions">
                <button onClick={startReply}>
                  <Send size={14} /> Responder
                </button>
                <button onClick={() => handleArchive().catch(console.error)}>
                  <Archive size={14} /> Arquivar
                </button>
                <button
                  className="danger"
                  onClick={() => handleDelete().catch(console.error)}
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </header>
            <div className="body">
              {message.bodyHtml ? (
                <div dangerouslySetInnerHTML={{ __html: message.bodyHtml }} />
              ) : (
                <pre>{message.bodyText}</pre>
              )}
            </div>
          </article>
        ) : (
          <div className="empty center-pane">
            Selecione uma mensagem ou escreva um novo e-mail.
          </div>
        )}
      </section>
    </div>
  );
}

function FolderButton({
  folder,
  active,
  onClick,
}: {
  folder: Folder;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = ICONS[folder.kind];
  const count =
    folder.kind === 'INBOX' || folder.kind === 'TRASH'
      ? folder.unread || folder.total
      : folder.unread > 0
        ? folder.unread
        : 0;

  return (
    <button
      className={`folder-btn ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <Icon size={16} />
      <span className="label">{folder.name}</span>
      {count > 0 && <span className="badge">{count}</span>}
    </button>
  );
}
