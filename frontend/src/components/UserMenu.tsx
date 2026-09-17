import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/authStore';

const UserMenu = observer(() => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!authStore.user) return null;
  const { user } = authStore;
  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="user-avatar">{initials}</span>
        <span className="user-name">{user.fullName}</span>
        <span className="user-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="user-popup">
          <div className="user-popup-header">
            <div className="user-avatar user-avatar--lg">{initials}</div>
            <div>
              <div className="user-popup-name">{user.fullName}</div>
              <div className="user-popup-login">@{user.login}</div>
            </div>
          </div>
          {user.canDownloadHisOwnDataBase && (
            <div className="user-popup-flag">
              Загрузка базы данных доступна
            </div>
          )}
          <div className="user-popup-divider" />
          <button
            className="user-popup-logout"
            onClick={() => {
              setOpen(false);
              authStore.logout();
            }}
          >
            Выйти из аккаунта
          </button>
        </div>
      )}
    </div>
  );
});

export default UserMenu;