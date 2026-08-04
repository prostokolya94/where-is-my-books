import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../stores/rootStore';
import { BOOK_STATUS_LABELS, BOOK_STATUSES } from '../api/types';

const StatsPage = observer(() => {
  const { stats, catalog } = rootStore;

  useEffect(() => {
    stats.load();
  }, []);

  if (!stats.stats) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Статистика</h1>
        </div>
        {stats.loading ? <div className="loading-bar">Загрузка…</div> : null}
        {stats.error && <div className="error-banner">{stats.error}</div>}
      </div>
    );
  }

  const data = stats.stats;
  const colKey = (id: number | null) => String(id ?? '');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Статистика</h1>
          <p className="page-subtitle">Количество книг каждого жанра (строки) по категориям (столбцы)</p>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stats-card">
          <div className="stats-card-value">{data.total}</div>
          <div className="stats-card-label">Всего книг</div>
        </div>
        {BOOK_STATUSES.map((status) => (
          <div className="stats-card" key={status}>
            <div className="stats-card-value" style={{ color: 'var(--ink)' }}>
              {data.statusTotals[status]}
            </div>
            <div className="stats-card-label">{BOOK_STATUS_LABELS[status]}</div>
          </div>
        ))}
        <div className="stats-card">
          <div className="stats-card-value" style={{ color: 'var(--clay)' }}>
            {catalog.categories.length}
          </div>
          <div className="stats-card-label">Категорий</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value" style={{ color: 'var(--clay)' }}>
            {catalog.genres.length}
          </div>
          <div className="stats-card-label">Жанров</div>
        </div>
      </div>

      <div className="stats-toolbar">
        <label style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Показывать по статусу:</label>
        <select
          value={stats.status ?? ''}
          onChange={(e) => stats.setStatus(e.target.value === '' ? null : (e.target.value as never))}
        >
          <option value="">Все статусы</option>
          {BOOK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {BOOK_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {stats.status && (
          <span className="badge badge-none">Отфильтровано: {BOOK_STATUS_LABELS[stats.status]}</span>
        )}
      </div>

      {stats.error && <div className="error-banner">{stats.error}</div>}

      <div className="stats-table-wrap">
        <table className="stats-table">
          <thead>
            <tr>
              <th style={{ minWidth: 180 }}>Жанр</th>
              {data.columns.map((col) => (
                <th key={col.id ?? '__none'}>{col.name}</th>
              ))}
              <th>Итого</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => {
              const hint =
                row.genreCategoryId !== null && row.genreId !== null
                  ? ` · ${data.columns.find((c) => c.id === row.genreCategoryId)?.name ?? ''}`
                  : '';
              return (
                <tr key={row.genreId ?? '__nog'} className={row.genreId === null ? 'is-total' : ''}>
                  <td className="row-label">
                    {row.genreName}
                    {hint && <span className="cat-hint">{hint}</span>}
                  </td>
                  {data.columns.map((col) => {
                    const value = row.byCategory[colKey(col.id)] ?? 0;
                    return (
                      <td key={col.id ?? '__none'} className={value === 0 ? 'is-zero' : ''}>
                        {value || ''}
                      </td>
                    );
                  })}
                  <td className={row.total === 0 ? 'is-zero' : ''}>{row.total}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="is-total">
              <td className="row-label">Итого</td>
              {data.columns.map((col) => (
                <td key={col.id ?? '__none'} className={col.total === 0 ? 'is-zero' : ''}>
                  {col.total}
                </td>
              ))}
              <td>{data.total}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});

export default StatsPage;
