import { FormEvent, useState } from 'react';
import { Send, X } from 'lucide-react';
import { api } from '../api';
import type { Message } from '../types';

type Props = {
  replyTo: Message | null;
  onCancel: () => void;
  onDone: () => Promise<void>;
};

export function Composer({ replyTo, onCancel, onDone }: Props) {
  const [to, setTo] = useState(replyTo?.fromAddr ?? '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, '')}` : '',
  );
  const [body, setBody] = useState(
    replyTo
      ? `\n\n---\nEm ${new Date(replyTo.createdAt).toLocaleString('pt-BR')}, ${replyTo.fromAddr} escreveu:\n${replyTo.bodyText}`
      : '',
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(draft: boolean) {
    setError('');
    setSaving(true);
    try {
      await api.post('/messages', {
        to,
        cc,
        subject,
        bodyText: body,
        draft,
      });
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit(false);
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <div className="composer-toolbar">
        <button
          type="submit"
          className="primary-action"
          disabled={saving}
        >
          <Send size={16} /> {saving ? 'Enviando…' : 'Enviar'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit(true)}
        >
          Salvar rascunho
        </button>
        <button type="button" onClick={onCancel}>
          <X size={16} /> Descartar
        </button>
        {error && <span className="error inline">{error}</span>}
      </div>
      <div className="composer-form">
        <h2>{replyTo ? 'Responder' : 'Nova mensagem'}</h2>
        <label>
          Para
          <input value={to} onChange={(e) => setTo(e.target.value)} required />
        </label>
        <label>
          Cc
          <input value={cc} onChange={(e) => setCc(e.target.value)} />
        </label>
        <label>
          Assunto
          <input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="grow">
          Mensagem
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
          />
        </label>
      </div>
    </form>
  );
}
