import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('Пароль должен быть не короче 4 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    if (!token) {
      setError('Ссылка повреждена: в ней нет токена');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-header">
          <div className="auth-icon">🔑</div>
          <h1>Новый пароль</h1>
          <p>Задайте новый пароль для вашего аккаунта</p>
        </div>

        {done ? (
          <div className="success-banner">
            <p style={{ margin: '0 0 4px' }}>Пароль успешно изменён.</p>
            <p style={{ margin: 0 }}>
              Теперь можно <Link to="/login">войти с новым паролем</Link>.
            </p>
          </div>
        ) : (
          <>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 18 }}>
              <div className="form-field">
                <label>Новый пароль</label>
                <input
                  autoFocus
                  type="password"
                  autoComplete="new-password"
                  placeholder="Пароль (от 4 символов)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Повторите пароль</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ещё раз"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <div>
                <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Сохранение…' : 'Сохранить пароль'}
                </button>
              </div>
            </form>
          </>
        )}

        <div className="auth-footer">
          Вспомнили пароль? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;