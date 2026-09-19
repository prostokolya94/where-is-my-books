import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить письмо');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-header">
          <div className="auth-icon">🗝</div>
          <h1>Восстановление пароля</h1>
          <p>Укажите email, на который зарегистрирован аккаунт</p>
        </div>

        {sent ? (
          <div className="success-banner">
            <p style={{ margin: 0 }}>
              Если аккаунт с таким email существует, мы отправили ссылку для сброса
              пароля. Проверьте почту (включая спам).
            </p>
          </div>
        ) : (
          <>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 18 }}>
              <div className="form-field">
                <label>Email</label>
                <input
                  autoFocus
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <button className="btn btn-primary auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Отправка…' : 'Отправить ссылку'}
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

export default ForgotPasswordPage;