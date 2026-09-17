import { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { api } from '../api/client';
import { authStore } from '../stores/authStore';
import type { AdminUser } from '../api/types';

const Toggle = ({
  value,
  disabled,
  onChange,
  title,
}: {
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  title: string;
}) => (
  <button
    className={`admin-toggle${value ? ' on' : ''}`}
    disabled={disabled}
    title={title}
    onClick={() => onChange(!value)}
  >
    <span className="admin-toggle-knob" />
  </button>
);

const AdminPage = observer(() => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await api.getAdminUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = async (id: number, data: { isAdmin?: boolean; canDownloadHisOwnDataBase?: boolean }) => {
    setBusyIds((prev) => new Set(prev).add(id));
    setError(null);
    try {
      const updated = await api.updateAdminUser(id, data);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      if (updated.id === authStore.user?.id) {
        await authStore.refresh();
      }
      if (updated.id === authStore.user?.id && updated.isAdmin === false) {
        authStore.logout();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось обновить пользователя');
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Администрирование</h1>
          <p className="page-subtitle">Пользователи сервиса и их права доступа.</p>
        </div>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          Обновить
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-bar">Загрузка…</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Логин</th>
                <th>Полное имя</th>
                <th>Админ</th>
                <th>Загрузка своей БД</th>
                <th>Зарегистрирован</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    Пользователи не найдены
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="admin-table-id">{user.id}</td>
                  <td className="admin-table-login">@{user.login}</td>
                  <td>{user.fullName}</td>
                  <td>
                    <Toggle
                      value={user.isAdmin}
                      disabled={busyIds.has(user.id) || user.id === authStore.user?.id}
                      title={
                        user.id === authStore.user?.id
                          ? 'Нельзя снять права администратора с себя'
                          : 'Права администратора'
                      }
                      onChange={(isAdmin) => setField(user.id, { isAdmin })}
                    />
                  </td>
                  <td>
                    <Toggle
                      value={user.canDownloadHisOwnDataBase}
                      disabled={busyIds.has(user.id)}
                      title="Разрешить скачивание своей базы данных"
                      onChange={(canDownloadHisOwnDataBase) =>
                        setField(user.id, { canDownloadHisOwnDataBase })
                      }
                    />
                  </td>
                  <td className="admin-table-date">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export default AdminPage;