import { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { api } from '../api/client';
import { authStore } from '../stores/authStore';
import Modal from '../components/Modal';
import type { AdminUser, EventSummaryRow } from '../api/types';

const EVENT_LABELS: Record<string, string> = {
  'page.open': 'Открытие страницы',
  'auth.register': 'Регистрация',
  'auth.login': 'Вход в аккаунт',
  'auth.logout': 'Выход из аккаунта',
  'book.create': 'Создание книги',
  'book.update': 'Редактирование книги',
  'book.delete': 'Удаление книги',
  'category.create': 'Создание категории',
  'category.update': 'Редактирование категории',
  'category.delete': 'Удаление категории',
  'category.reorder': 'Сортировка категорий',
  'genre.create': 'Создание жанра',
  'genre.update': 'Редактирование жанра',
  'genre.delete': 'Удаление жанра',
  'genre.reorder': 'Сортировка жанров',
  'tab.create': 'Создание вкладки',
  'tab.update': 'Редактирование вкладки',
  'tab.delete': 'Удаление вкладки',
  'plan.year.create': 'Добавление года плана',
  'plan.year.delete': 'Удаление года плана',
  'plan.row.create': 'Добавление строки плана',
  'plan.row.update': 'Изменение строки плана',
  'plan.row.delete': 'Удаление строки плана',
  'plan.subrow.create': 'Добавление подстроки плана',
  'plan.subrow.update': 'Изменение подстроки плана',
  'plan.subrow.delete': 'Удаление подстроки плана',
  'cost.account.create': 'Создание счёта',
  'cost.account.update': 'Редактирование счёта',
  'cost.account.delete': 'Удаление счёта',
  'unread.target.set': 'Установка цели чтения',
  'dump.create': 'Создание версии БД',
  'dump.apply': 'Применение версии БД',
  'dump.download': 'Скачивание версии БД',
  'dump.upload': 'Загрузка версии БД',
  'dump.delete': 'Удаление версии БД',
};

const PAGE_LABELS: Record<string, string> = {
  books: 'Книги (главная)',
  tab: 'Вкладка',
  categories: 'Категории и жанры',
  stats: 'Статистика',
  plans: 'План покупок',
  unread: 'Мониторинг непрочитанного',
  read: 'Мониторинг прочитанного',
  costs: 'Стоимость библиотеки',
  admin: 'Админ-панель',
};

function pageLabel(page: string): string {
  return PAGE_LABELS[page] ?? page;
}

function eventLabel(type: string): string {
  return EVENT_LABELS[type] ?? type;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultPeriod(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  return { from: toDateString(from), to: toDateString(to) };
}

function formatLastAt(lastAt: string | null): string {
  if (!lastAt) return '—';
  try {
    return new Date(lastAt).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

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
    onClick={(e) => {
      e.stopPropagation();
      onChange(!value);
    }}
  >
    <span className="admin-toggle-knob" />
  </button>
);

const SummaryTable = ({
  rows,
  onBreakdown,
}: {
  rows: EventSummaryRow[];
  onBreakdown?: (type: string) => void;
}) => (
  <div className="admin-table-wrap" style={{ borderRadius: 10 }}>
    <table className="admin-table admin-table-clickable">
      <thead>
        <tr>
          <th>Событие</th>
          <th>Кол-во</th>
          <th>Последний раз</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={3} className="admin-table-empty">
              Событий за выбранный период нет
            </td>
          </tr>
        )}
        {rows.map((row) =>
          row.type === 'page.open' ? (
            <tr key={row.type} onClick={() => onBreakdown?.(row.type)}>
              <td>
                {eventLabel(row.type)}
                <span className="admin-drill-hint">› подробнее</span>
              </td>
              <td style={{ fontWeight: 600 }}>{row.count}</td>
              <td className="admin-table-date">{formatLastAt(row.lastAt)}</td>
            </tr>
          ) : (
            <tr key={row.type}>
              <td>{eventLabel(row.type)}</td>
              <td style={{ fontWeight: 600 }}>{row.count}</td>
              <td className="admin-table-date">{formatLastAt(row.lastAt)}</td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  </div>
);

const AdminPage = observer(() => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<{ from: string; to: string }>(defaultPeriod);
  const [events, setEvents] = useState<EventSummaryRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [modalUser, setModalUser] = useState<AdminUser | null>(null);
  const [modalEvents, setModalEvents] = useState<EventSummaryRow[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const [drillOpen, setDrillOpen] = useState(false);
  const [drillUser, setDrillUser] = useState<AdminUser | null>(null);
  const [drillRows, setDrillRows] = useState<EventSummaryRow[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);

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

  const loadEvents = useCallback(async (from: string, to: string) => {
    setEventsLoading(true);
    try {
      setEvents(await api.getAdminEventSummary(from, to));
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadEvents(period.from, period.to);
  }, [period.from, period.to, loadEvents]);

  const openModal = useCallback(async (user: AdminUser) => {
    setModalUser(user);
    setModalLoading(true);
    setModalEvents([]);
    try {
      setModalEvents(await api.getAdminEventSummary(period.from, period.to, user.id));
    } catch {
      setModalEvents([]);
    } finally {
      setModalLoading(false);
    }
  }, [period.from, period.to]);

  const openDrill = useCallback(
    async (type: string, userId?: number) => {
      const user = userId ? users.find((u) => u.id === userId) ?? null : null;
      setDrillUser(user);
      setDrillOpen(true);
      setDrillLoading(true);
      setDrillRows([]);
      try {
        setDrillRows(
          await api.getAdminEventBreakdown(type, period.from, period.to, userId),
        );
      } catch {
        setDrillRows([]);
      } finally {
        setDrillLoading(false);
      }
    },
    [period.from, period.to, users],
  );

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
          <p className="page-subtitle">Пользователи сервиса, их права и события.</p>
        </div>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          Обновить
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">События</h2>
          <div className="admin-period">
            <label>
              С
              <input
                type="date"
                value={period.from}
                onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
              />
            </label>
            <label>
              По
              <input
                type="date"
                value={period.to}
                onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
              />
            </label>
            <button className="btn btn-outline" onClick={() => setPeriod(defaultPeriod())}>
              Последние 7 дней
            </button>
          </div>
        </div>
        {eventsLoading ? (
          <div className="loading-bar">Загрузка…</div>
        ) : (
          <SummaryTable rows={events} onBreakdown={(type) => openDrill(type)} />
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Пользователи</h2>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Нажмите на строку — откроются события пользователя
          </div>
        </div>
        {loading ? (
          <div className="loading-bar">Загрузка…</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-clickable">
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
                  <tr key={user.id} onClick={() => openModal(user)}>
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

      {modalUser && (
        <Modal
          title={`События пользователя @${modalUser.login}`}
          onClose={() => setModalUser(null)}
          width={560}
          footer={
            <button className="btn btn-outline" onClick={() => setModalUser(null)}>
              Закрыть
            </button>
          }
        >
          <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--muted)' }}>
            {modalUser.fullName} · период {period.from} — {period.to}
          </p>
          {modalLoading ? (
            <div className="loading-bar">Загрузка…</div>
          ) : (
            <SummaryTable
              rows={modalEvents}
              onBreakdown={(type) => openDrill(type, modalUser.id)}
            />
          )}
        </Modal>
      )}

      {drillOpen && (
        <Modal
          title={`${drillUser ? `Страницы @${drillUser.login}` : 'Открытия страниц'}`}
          onClose={() => setDrillOpen(false)}
          width={560}
          footer={
            <button className="btn btn-outline" onClick={() => setDrillOpen(false)}>
              Закрыть
            </button>
          }
        >
          <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--muted)' }}>
            Разбивка по открытым страницам · период {period.from} — {period.to}
          </p>
          {drillLoading ? (
            <div className="loading-bar">Загрузка…</div>
          ) : (
            <div className="admin-table-wrap" style={{ borderRadius: 10 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Страница</th>
                    <th>Открытий</th>
                    <th>Последний раз</th>
                  </tr>
                </thead>
                <tbody>
                  {drillRows.length === 0 && (
                    <tr>
                      <td colSpan={3} className="admin-table-empty">
                        Открытий страниц за период нет
                      </td>
                    </tr>
                  )}
                  {drillRows.map((row) => (
                    <tr key={row.type}>
                      <td>{pageLabel(row.type)}</td>
                      <td style={{ fontWeight: 600 }}>{row.count}</td>
                      <td className="admin-table-date">{formatLastAt(row.lastAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
});

export default AdminPage;