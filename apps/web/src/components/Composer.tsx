import { FormEvent, useState } from 'react';
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
      <header>
        <h2>{replyTo ? 'Responder' : 'Nova mensagem'}</h2>
        {error && <div className="error">{error}</div>}
      </header>
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
      <div className="actions">
        <button type="submit" disabled={saving}>
          Enviar
        </button>
        <button
          type="button"
          className="secondary"
          disabled={saving}
          onClick={() => void submit(true)}
        >
          Salvar rascunho
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
