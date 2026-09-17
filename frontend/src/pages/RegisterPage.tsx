import { useState, type FormEvent } from 'react';
import { observer } from 'mobx-react-lite';
import { Link, useNavigate } from 'react-router-dom';
import { authStore } from '../stores/authStore';

const RegisterPage = observer(() => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await authStore.register(login.trim(), password, fullName.trim());
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
          <p>Создайте учётную запись</p>
        </div>

        {authStore.error && (
          <div className="error-banner">{authStore.error}</div>
        )}

        <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 18 }}>
          <div className="form-field">
            <label>ФИО</label>
            <input
              autoFocus
              placeholder="Ваше имя"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Логин</label>
            <input
              autoComplete="username"
              placeholder="Придумайте логин (от 3 символов)"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>Пароль</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Пароль (от 4 символов)"
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
              {authStore.loading ? 'Регистрация…' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          Уже есть аккаунт?{' '}
          <Link to="/login">Войдите</Link>
        </div>
      </div>
    </div>
  );
});

export default RegisterPage;