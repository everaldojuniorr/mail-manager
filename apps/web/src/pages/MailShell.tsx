import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Inbox,
  LogOut,
  Menu,
  Moon,
  Pencil,
  Plane,
  Plus,
  Reply,
  ShieldAlert,
  Sun,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useTheme } from '../theme';
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
  const { theme, toggleTheme } = useTheme();
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'list' | 'detail'>('list');

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
    setMobilePane('list');
    refreshMessages(selectedFolderId).catch((err) =>
      setError(err instanceof Error ? err.message : 'Erro ao carregar lista'),
    );
  }, [selectedFolderId, refreshMessages]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  async function openMessage(id: string) {
    setComposing(false);
    setReplyTo(null);
    setSelectedId(id);
    setMobilePane('detail');
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
    setMobilePane('list');
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
    setMobilePane('list');
    await refreshFolders();
    await refreshMessages(selectedFolderId);
  }

  function startCompose() {
    setReplyTo(null);
    setComposing(true);
    setSelectedId(null);
    setMessage(null);
    setMobilePane('detail');
    setMenuOpen(false);
  }

  function startReply() {
    if (!message) return;
    setReplyTo(message);
    setComposing(true);
    setMobilePane('detail');
  }

  function selectFolder(folderId: string) {
    setSelectedFolderId(folderId);
    setMenuOpen(false);
    setMobilePane('list');
  }

  function backToList() {
    setComposing(false);
    setReplyTo(null);
    setSelectedId(null);
    setMessage(null);
    setMobilePane('list');
  }

  async function onComposerDone() {
    setComposing(false);
    setReplyTo(null);
    setMobilePane('list');
    await refreshFolders();
    if (selectedFolderId) await refreshMessages(selectedFolderId);
  }

  const folderNavProps = {
    userEmail: user?.email,
    userName: user?.displayName || user?.email,
    favorites,
    account,
    selectedFolderId,
    onSelectFolder: selectFolder,
    onCompose: startCompose,
    onLogout: logout,
  };

  return (
    <div className="shell">
      <header className="topbar">
        <button
          type="button"
          className="icon-btn menu-btn"
          aria-label="Abrir menu de pastas"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div className="topbar-brand">
          <span className="topbar-brand-mark" aria-hidden>
            <Wallet size={16} strokeWidth={2.25} />
          </span>
          <strong>Mail Manager</strong>
        </div>
        <div className="topbar-spacer" />
        <div className="topbar-actions">
          <button
            type="button"
            className="icon-btn with-label"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
            aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span className="btn-label">{theme === 'light' ? 'Escuro' : 'Claro'}</span>
          </button>
          <button
            type="button"
            className="icon-btn with-label desktop-only-action"
            onClick={logout}
            title="Sair"
          >
            <LogOut size={18} />
            <span className="btn-label">Sair</span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="nav-drawer-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`nav-drawer ${menuOpen ? 'open' : ''}`}
        aria-hidden={!menuOpen}
        aria-label="Menu de pastas"
      >
        <div className="nav-drawer-header">
          <div className="topbar-brand">
            <span className="topbar-brand-mark" aria-hidden>
              <Wallet size={16} strokeWidth={2.25} />
            </span>
            <strong>Mail Manager</strong>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <FolderNav {...folderNavProps} />
      </aside>

      <div
        className={`shell-body ${mobilePane === 'detail' ? 'mobile-detail' : 'mobile-list'}`}
      >
        <aside className="sidebar desktop-sidebar">
          <FolderNav {...folderNavProps} />
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
                    type="button"
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
            <>
              <div className="mobile-back-bar">
                <button type="button" className="icon-btn with-label" onClick={backToList}>
                  <ArrowLeft size={18} />
                  <span>Voltar</span>
                </button>
              </div>
              <Composer
                replyTo={replyTo}
                onCancel={backToList}
                onDone={onComposerDone}
              />
            </>
          ) : message ? (
            <article className="message-view">
              <div className="message-toolbar">
                <button
                  type="button"
                  className="mobile-back"
                  onClick={backToList}
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button type="button" onClick={startReply}>
                  <Reply size={16} /> Responder
                </button>
                <button
                  type="button"
                  onClick={() => handleArchive().catch(console.error)}
                >
                  <Archive size={16} /> Arquivar
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete().catch(console.error)}
                >
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
              <div className="message-content">
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
                <div className="body">
                  {message.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: message.bodyHtml }} />
                  ) : (
                    <pre>{message.bodyText}</pre>
                  )}
                </div>
              </div>
            </article>
          ) : (
            <div className="center-pane">
              <Wallet size={48} className="empty-mark" strokeWidth={1.25} />
              <p>Selecione uma mensagem ou escreva um novo e-mail.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FolderNav({
  userEmail,
  userName,
  favorites,
  account,
  selectedFolderId,
  onSelectFolder,
  onCompose,
  onLogout,
}: {
  userEmail?: string;
  userName?: string;
  favorites: Folder[];
  account: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onCompose: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="folder-nav">
      <div className="account-chip">
        <strong>{userName}</strong>
        <span className="muted tiny">{userEmail}</span>
      </div>

      <button type="button" className="primary full" onClick={onCompose}>
        <Plus size={18} />
        <span>Novo e-mail</span>
      </button>

      <nav className="folder-group" aria-label="Favoritos">
        <div className="group-title">Favoritos</div>
        {favorites.map((folder) => (
          <FolderButton
            key={`fav-${folder.id}`}
            folder={folder}
            active={folder.id === selectedFolderId}
            onClick={() => onSelectFolder(folder.id)}
          />
        ))}
      </nav>

      <nav className="folder-group" aria-label="Pastas">
        <div className="group-title">Pastas</div>
        {account.map((folder) => (
          <FolderButton
            key={folder.id}
            folder={folder}
            active={folder.id === selectedFolderId}
            onClick={() => onSelectFolder(folder.id)}
          />
        ))}
      </nav>

      <button type="button" className="ghost logout" onClick={onLogout}>
        <LogOut size={16} />
        <span>Sair</span>
      </button>
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
      type="button"
      className={`folder-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={16} />
      <span className="label">{folder.name}</span>
      {count > 0 && <span className="badge">{count}</span>}
    </button>
  );
}
