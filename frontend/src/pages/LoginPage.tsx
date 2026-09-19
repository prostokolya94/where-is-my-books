import { useState, type FormEvent } from 'react';
import { observer } from 'mobx-react-lite';
import { Link, useNavigate } from 'react-router-dom';
import { authStore } from '../stores/authStore';

const LoginPage = observer(() => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await authStore.login(login.trim(), password);
      navigate('/', { replace: true });
    } catch {
      // error handled in store
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">📚</div>
          <h1>Моя библиотека</h1>
          <p>Войдите, чтобы получить доступ к каталогу</p>
        </div>

        {authStore.error && (
          <div className="error-banner">{authStore.error}</div>
        )}

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 18 }}>
          <div className="form-field">
            <label>Логин</label>
            <input
              autoFocus
              autoComplete="username"
              placeholder="Введите логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Пароль</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              className="btn btn-primary auth-btn"
              type="submit"
              disabled={authStore.loading}
            >
              {authStore.loading ? 'Вход…' : 'Войти'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          Нет аккаунта?{' '}
          <Link to="/register">Зарегистрируйтесь</Link>
          <span className="auth-footer-sep">·</span>
          <Link to="/forgot">Забыли пароль?</Link>
        </div>
      </div>
    </div>
  );
});

export default LoginPage;