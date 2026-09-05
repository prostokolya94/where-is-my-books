import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { rootStore } from '../stores/rootStore';
import { BarChart, type BarChartBar } from '../components/charts/BarChart';
import type { UnreadSeriesPoint, UnreadYearInfo } from '../api/types';

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function seriesToBars(series: UnreadSeriesPoint[]): BarChartBar[] {
  return series.map((s) => ({
    value: s.total,
    label: `${MONTHS_SHORT[s.month - 1]} ${String(s.year).slice(2)}${s.isCurrent ? ' *' : ''}`,
    fill: s.isCurrent ? 'var(--clay)' : 'var(--teal)',
    opacity: s.isCurrent ? 1 : 0.5,
    valueFill: s.isCurrent ? 'var(--clay)' : 'var(--pine)',
  }));
}

function yearsToBars(data: UnreadYearInfo[]): BarChartBar[] {
  return data.map((d) => ({
    value: d.count,
    label: d.year !== null ? String(d.year) : 'нет',
  }));
}

function TargetInput({
  value,
  disabled,
  onCommit,
}: {
  value: number | null;
  disabled?: boolean;
  onCommit: (v: number | null) => void;
}) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));

  useEffect(() => {
    setDraft(value === null ? '' : String(value));
  }, [value]);

  return (
    <input
      type="number"
      min={0}
      className="unread-target-input"
      placeholder="—"
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft === '') {
          if (value !== null) onCommit(null);
          return;
        }
        const n = Number(draft);
        if (Number.isInteger(n) && n >= 0 && n !== value) onCommit(n);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
        if (e.key === 'Escape') {
          setDraft(value === null ? '' : String(value));
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
    />
  );
}

const UnreadMonitoringPage = observer(() => {
  const { unread } = rootStore;
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    unread.load();
  }, []);

  const data = unread.overview;
  const delta =
    data && data.total.previousMonth !== null
      ? data.total.current - data.total.previousMonth
      : null;

  const commitGenreTarget = async (genreId: number, target: number | null) => {
    if (genreId == null) return;
    setBusy(true);
    try {
      await unread.setGenreTarget(genreId, target);
    } catch {
      await unread.load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Мониторинг непрочитанного</h1>
          <p className="page-subtitle">
            Непрочитанными считаются книги со статусом «Куплена, не прочитана». Остаток каждого
            месяца замораживается 1-го числа следующего месяца.
          </p>
        </div>
      </div>

      {unread.error && <div className="error-banner">{unread.error}</div>}

      {!data ? (
        unread.loading ? (
          <div className="loading-bar">Загрузка…</div>
        ) : null
      ) : (
        <>
          <div className="stats-summary">
            <div className="stats-card">
              <div className="stats-card-value" style={{ color: 'var(--clay)' }}>
                {data.total.current}
              </div>
              <div className="stats-card-label">Сейчас непрочитано</div>
            </div>
            <div className="stats-card">
              <div className="stats-card-value" style={{ color: 'var(--pine)' }}>
                {data.total.previousMonth ?? '—'}
              </div>
              <div className="stats-card-label">Пред. месяц (заморожено)</div>
            </div>
            <div className="stats-card">
              <div
                className="stats-card-value"
                style={{
                  color:
                    delta === null
                      ? 'var(--muted)'
                      : delta > 0
                        ? 'var(--danger)'
                        : 'var(--read)',
                }}
              >
                {delta === null ? '—' : delta > 0 ? `+${delta}` : delta}
              </div>
              <div className="stats-card-label">Изменение к пред. месяцу</div>
            </div>
          </div>

          <div className="unread-card">
            <div className="unread-card-head">
              <h3 className="unread-card-title">Динамика непрочитанного</h3>
              <span className="unread-legend">
                <span className="unread-dot unread-dot-current" /> текущий месяц (в реальном
                времени)
                <span className="unread-dot unread-dot-frozen" /> замороженный месяц
              </span>
            </div>
            <div className="chart-scroll">
              <BarChart bars={seriesToBars(data.series)} height={250} barWidth={30} />
            </div>
          </div>

          <div className="unread-card">
            <div className="unread-card-head">
              <h3 className="unread-card-title">Остатки по году покупки</h3>
            </div>
            <div className="chart-scroll">
              <BarChart bars={yearsToBars(data.yearBreakdown)} />
            </div>
          </div>

          <div className="unread-card">
            <div className="unread-card-head">
              <h3 className="unread-card-title">Остатки по жанрам</h3>
              <span className="unread-hint">Цель задаётся для жанра; сравнение — с остатком</span>
            </div>
            {data.genres.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📖</div>
                <div className="empty-state-text">
                  Нет непрочитанных книг — по жанрам пусто.
                </div>
              </div>
            ) : (
              <div className="unread-table-wrap">
                <table className="unread-table">
                  <thead>
                    <tr>
                      <th>Категория</th>
                      <th>Жанр</th>
                      <th style={{ textAlign: 'right' }}>Остаток</th>
                      <th style={{ textAlign: 'center' }}>Цель</th>
                      <th style={{ textAlign: 'right' }}>Состояние</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.genres].sort((a, b) => b.count - a.count).map((g, i) => (
                      <tr
                        key={g.genreId !== null ? `${g.categoryId}-${g.genreId}` : `nog-${g.categoryId}-${i}`}
                      >
                        <td className="cell-muted">{g.categoryName}</td>
                        <td className={g.count > 10 ? 'unread-over' : ''}>
                          {g.genreId != null ? (
                            <button
                              type="button"
                              className="genre-link"
                              onClick={() => navigate(`/?genre=${g.genreId}`)}
                              title={`Показать книги жанра «${g.name}»`}
                            >
                              {g.name}
                            </button>
                          ) : (
                            g.name
                          )}
                        </td>
                        <td className={`unread-num ${g.count > 10 ? 'unread-over' : ''}`}>
                          {g.count}
                        </td>
                        <td className="unread-num">
                          {g.genreId != null ? (
                            <TargetInput
                              value={g.target}
                              disabled={busy}
                              onCommit={(t) => void commitGenreTarget(g.genreId as number, t)}
                            />
                          ) : (
                            <span className="cell-muted">—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {g.genreId == null ? (
                            <span className="cell-muted">—</span>
                          ) : g.target === null ? (
                            <span className="badge badge-none">цель не задана</span>
                          ) : g.count > g.target ? (
                            <span className="badge badge-abandoned">
                              превышено на {g.count - g.target}
                            </span>
                          ) : (
                            <span className="badge badge-read">в пределах цели</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="unread-total">
                      <td colSpan={2} className="row-label">
                        Итого непрочитано
                      </td>
                      <td className="unread-num">{data.total.current}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

export default UnreadMonitoringPage;
