import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { authStore } from '../stores/authStore';

const ConfirmEmailPage = () => {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!token) {
        if (!cancelled) {
          setState('error');
          setMessage('Ссылка повреждена: в ней нет токена');
        }
        return;
      }
      try {
        const result = await api.confirmEmail(token);
        await authStore.refresh();
        if (!cancelled) {
          setState('done');
          setMessage(result.email);
        }
      } catch (err) {
        if (!cancelled) {
          setState('error');
          setMessage(err instanceof Error ? err.message : 'Не удалось подтвердить почту');
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-header">
          <div className="auth-icon">{state === 'loading' ? '⏳' : state === 'done' ? '✅' : '⚠️'}</div>
          <h1>Подтверждение почты</h1>
        </div>

        {state === 'loading' && <div className="loading-bar">Подтверждаем…</div>}
        {state === 'done' && (
          <div className="success-banner">
            <p style={{ margin: '0 0 4px' }}>
              Адрес <strong>{message}</strong> подтверждён.
            </p>
            <p style={{ margin: 0 }}>
              {authStore.isAuthenticated ? (
                <Link to="/">Вернуться к библиотеке</Link>
              ) : (
                <Link to="/login">Войти в аккаунт</Link>
              )}
            </p>
          </div>
        )}
        {state === 'error' && (
          <div className="error-banner">
            {message}. Можно{' '}
            <Link to="/register">зарегистрироваться заново</Link>{' '}
            или{' '}
            <Link to="/login">войти</Link>.
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailPage;