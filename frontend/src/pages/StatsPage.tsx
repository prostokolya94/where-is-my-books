import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { rootStore } from '../stores/rootStore';
import { BOOK_STATUS_LABELS, BOOK_STATUSES } from '../api/types';

const StatsPage = observer(() => {
  const { stats, catalog } = rootStore;
  const navigate = useNavigate();

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Статистика</h1>
          <p className="page-subtitle">
            Количество книг по жанрам в каждой категории (все статусы, кроме списка желаемого)
          </p>
        </div>
      </div>

      <div className="stats-grand">
        <div className="stats-grand-value">{data.total}</div>
        <div className="stats-grand-label">ИТОГО книг по всем категориям</div>
      </div>

      <div className="stats-summary">
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

      {stats.error && <div className="error-banner">{stats.error}</div>}

      {data.tables.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">Пока нет данных</div>
          <div className="empty-state-text">
            Книг вне списка желаемого ещё нет — таблицы появятся, как только вы добавите книги.
          </div>
        </div>
      ) : (
        <div className="stats-categories">
          {data.tables.map((table) => (
            <section className="stats-category" key={table.categoryId ?? '__none'}>
              <h2 className="stats-category-title">{table.categoryName}</h2>
              <table className="stats-table stats-table-vertical">
                <tbody>
                  {table.genres.map((genre) => (
                    <tr key={genre.genreId ?? '__nog'}>
                      <td className="row-label">
                        {genre.genreId != null ? (
                          <button
                            type="button"
                            className="genre-link"
                            onClick={() => navigate(`/?genre=${genre.genreId}`)}
                            title={`Показать книги жанра «${genre.genreName}»`}
                          >
                            {genre.genreName}
                          </button>
                        ) : (
                          genre.genreName
                        )}
                      </td>
                      <td className={genre.count === 0 ? 'is-zero' : ''}>{genre.count}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="is-total">
                    <td className="row-label">Итого</td>
                    <td>{table.total}</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
});

export default StatsPage;