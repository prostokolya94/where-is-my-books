import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../stores/rootStore';
import { BarChart, type BarChartBar } from '../components/charts/BarChart';
import type { GenreBar, ReadBar } from '../api/types';

function toBars(data: ReadBar[] | GenreBar[]): BarChartBar[] {
  return data.map((d) => ({ value: d.count, label: d.name }));
}

function TripleBlock({
  title,
  all,
  year,
  month,
  hint,
}: {
  title: string;
  all: ReadBar[] | GenreBar[];
  year: ReadBar[] | GenreBar[];
  month: ReadBar[] | GenreBar[];
  hint?: string;
}) {
  return (
    <div className="read-card">
      <div className="read-card-head">
        <h3 className="read-card-title">{title}</h3>
        {hint && <span className="read-hint">{hint}</span>}
      </div>
      <div className="read-triple">
        <div className="read-chart-wrap">
          <div className="read-chart-inner">
            <div className="read-chart-label">За всё время</div>
            <BarChart bars={toBars(all)} />
          </div>
        </div>
        <div className="read-chart-wrap">
          <div className="read-chart-inner">
            <div className="read-chart-label">За этот календарный год</div>
            <BarChart bars={toBars(year)} />
          </div>
        </div>
        <div className="read-chart-wrap">
          <div className="read-chart-inner">
            <div className="read-chart-label">За этот месяц</div>
            <BarChart bars={toBars(month)} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ReadMonitoringPage = observer(() => {
  const { read } = rootStore;

  useEffect(() => {
    read.load();
  }, []);

  const data = read.overview;
  const delta =
    data && data.total.previousMonth !== null
      ? data.total.current - data.total.previousMonth
      : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Мониторинг прочитанного</h1>
          <p className="page-subtitle">
            Прочитанными считаются книги со статусом «Прочитана». Период определяется по месяцу и
            году прочтения книги.
          </p>
        </div>
      </div>

      {read.error && <div className="error-banner">{read.error}</div>}

      {!data ? (
        read.loading ? (
          <div className="loading-bar">Загрузка…</div>
        ) : null
      ) : (
        <>
          <div className="stats-summary">
            <div className="stats-card">
              <div className="stats-card-value" style={{ color: 'var(--clay)' }}>
                {data.total.current}
              </div>
              <div className="stats-card-label">Сейчас прочитано</div>
            </div>
            <div className="stats-card">
              <div className="stats-card-value" style={{ color: 'var(--pine)' }}>
                {data.total.previousMonth ?? '—'}
              </div>
              <div className="stats-card-label">Прочитано в прошлом месяце</div>
            </div>
            <div className="stats-card">
              <div
                className="stats-card-value"
                style={{
                  color:
                    delta === null
                      ? 'var(--muted)'
                      : delta >= 0
                        ? 'var(--read)'
                        : 'var(--danger)',
                }}
              >
                {delta === null ? '—' : delta >= 0 ? `+${delta}` : delta}
              </div>
              <div className="stats-card-label">Изменение к пред. месяцу</div>
            </div>
          </div>

          <TripleBlock
            title="Динамика прочитанного"
            hint="Количество прочитанных книг по категориям"
            all={data.categories.all}
            year={data.categories.year}
            month={data.categories.month}
          />

          {data.byCategory.map((block) => (
            <TripleBlock
              key={block.categoryId !== null ? `cat-${block.categoryId}` : 'cat-null'}
              title={`По жанрам — ${block.name}`}
              all={block.periods.all}
              year={block.periods.year}
              month={block.periods.month}
            />
          ))}
        </>
      )}
    </div>
  );
});

export default ReadMonitoringPage;
