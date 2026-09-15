import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Moon, Sun, Wallet } from 'lucide-react';
import { useAuth } from '../auth';
import { useTheme } from '../theme';

export function RegisterPage() {
  const { token, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password, displayName || undefined);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <button
        type="button"
        className="icon-btn with-label auth-theme-toggle"
        onClick={toggleTheme}
        title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
        aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        <span>{theme === 'light' ? 'Escuro' : 'Claro'}</span>
      </button>
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-brand">
          <span className="auth-brand-mark" aria-hidden>
            <Wallet size={20} strokeWidth={2.25} />
          </span>
          <div>
            <h1>Criar conta</h1>
            <p className="muted">
              Usuário vira e-mail @financyexpert.com (ex.: alice@financyexpert.com)
            </p>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <label>
          Usuário
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            placeholder="seu.nome"
          />
        </label>
        <label>
          Nome exibido
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Opcional"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Criando…' : 'Criar conta'}
        </button>
        <p className="muted center">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
