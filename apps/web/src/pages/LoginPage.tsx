import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Moon, Sun, Wallet } from 'lucide-react';
import { useAuth } from '../auth';
import { useTheme } from '../theme';

export function LoginPage() {
  const { token, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@financyexpert.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
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
            <h1>Mail Manager</h1>
            <p className="muted">Entre na sua caixa de e-mail</p>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="muted center">
          Não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </form>
    </div>
  );
}
