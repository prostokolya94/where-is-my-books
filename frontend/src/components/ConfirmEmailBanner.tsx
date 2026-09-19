import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';
import { api } from '../api/client';

const ConfirmEmailBanner = observer(() => {
  const user = authStore.user;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.emailConfirmed || !user.email) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await api.resendConfirm();
      setSent(true);
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="email-confirm-banner">
      <span className="email-confirm-text">
        Подтвердите адрес почты — перейдите по ссылке из письма
        {sent && <strong> · Письмо отправлено</strong>}
      </span>
      <button
        className="btn btn-ghost btn-sm"
        onClick={handleResend}
        disabled={sending || sent}
      >
        {sending ? 'Отправка…' : sent ? 'Отправлено' : 'Выслать письмо ещё раз'}
      </button>
    </div>
  );
});

export default ConfirmEmailBanner;