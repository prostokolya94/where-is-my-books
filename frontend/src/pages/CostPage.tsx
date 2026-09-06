import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../stores/rootStore';
import ConfirmDialog from '../components/ConfirmDialog';
import CostAccountModal, { describeFilters } from '../components/CostAccountModal';
import type { CostAccountView } from '../api/types';

function formatMoney(value: number): string {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`;
}

const CostPage = observer(() => {
  const { costs } = rootStore;
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorAccount, setEditorAccount] = useState<CostAccountView | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CostAccountView | null>(null);

  useEffect(() => {
    costs.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = costs.summary;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Стоимость библиотеки</h1>
          <p className="page-subtitle">
            Суммарная стоимость книг (без учёта списка желаемого). Счёта — это срезы стоимости по
            вашим фильтрам; они всегда пересчитываются по актуальным данным библиотеки.
          </p>
        </div>
      </div>

      {costs.error && <div className="error-banner">{costs.error}</div>}

      {!data ? (
        costs.loading ? (
          <div className="loading-bar">Загрузка…</div>
        ) : null
      ) : (
        <>
          <div className="stats-summary">
            <div className="stats-card">
              <div className="stats-card-value" style={{ color: 'var(--ink)' }}>
                {formatMoney(data.total)}
              </div>
              <div className="stats-card-label">
                Всего · {data.counts.total} книг
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-card-value" style={{ color: 'var(--read)' }}>
                {formatMoney(data.read)}
              </div>
              <div className="stats-card-label">
                Прочитано · {data.counts.read} книг
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-card-value" style={{ color: 'var(--clay)' }}>
                {formatMoney(data.unread)}
              </div>
              <div className="stats-card-label">
                Непрочитано · {data.counts.unread} книг
              </div>
            </div>
          </div>

          <div className="cost-toolbar">
            <h2 className="cost-section-title">Счета</h2>
            <div className="cost-toolbar-actions">
              <button
                className="btn btn-outline"
                onClick={() => costs.load()}
                disabled={costs.loading}
                title="Пересчитать по актуальным данным"
              >
                ⟳ Пересчитать
              </button>
              <button
                className="btn btn-accent"
                onClick={() => {
                  setEditorAccount(null);
                  setEditorOpen(true);
                }}
              >
                + Создать счёт
              </button>
            </div>
          </div>

          {data.accounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🧾</div>
              <div className="empty-state-title">Счетов пока нет</div>
              <div className="empty-state-text">
                Создайте счёт — набор фильтров по категориям, жанрам, статусам и годам покупки.
                Сумма счёта всегда будет соответствовать текущему состоянию библиотеки.
              </div>
            </div>
          ) : (
            <div className="cost-grid">
              {data.accounts.map((account) => (
                <div className="cost-card" key={account.id}>
                  <div className="cost-card-head">
                    <div className="cost-card-title">{account.name}</div>
                    <div className="cost-card-actions">
                      <button
                        className="icon-btn"
                        title="Редактировать"
                        onClick={() => {
                          setEditorAccount(account);
                          setEditorOpen(true);
                        }}
                      >
                        ✎
                      </button>
                      <button
                        className="icon-btn danger"
                        title="Удалить счёт"
                        onClick={() => setDeleteTarget(account)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div className="cost-card-desc">{describeFilters(account.filters)}</div>
                  <div className="cost-card-sum">
                    <span className="cost-card-money">{formatMoney(account.result.sum)}</span>
                    <span className="cost-card-count">· {account.result.count} книг</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editorOpen && (
        <CostAccountModal account={editorAccount} onClose={() => setEditorOpen(false)} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Удалить счёт?"
          message={`Счёт «${deleteTarget.name}» будет удалён. Книги не изменятся.`}
          onConfirm={async () => {
            await costs.remove(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
});

export default CostPage;