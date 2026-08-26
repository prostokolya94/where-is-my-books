import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { rootStore } from '../stores/rootStore';
import type { UnreadSeriesPoint, UnreadYearInfo } from '../api/types';

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function niceStep(maxVal: number): number {
  if (maxVal <= 5) return 1;
  if (maxVal <= 10) return 2;
  if (maxVal <= 25) return 5;
  if (maxVal <= 50) return 10;
  if (maxVal <= 100) return 20;
  if (maxVal <= 200) return 50;
  if (maxVal <= 500) return 100;
  return 200;
}

function UnreadChart({ series }: { series: UnreadSeriesPoint[] }) {
  const H = 250;
  const top = 22;
  const bottom = 30;
  const left = 38;
  const right = 10;
  const slotW = 66;
  const barW = 30;

  if (series.length === 0) {
    return <div className="loading-bar">Нет данных для графика</div>;
  }

  const maxVal = Math.max(...series.map((s) => s.total), 1);
  const step = niceStep(maxVal);
  const maxAxis = Math.ceil(maxVal / step) * step;
  const plotH = H - top - bottom;
  const W = series.length * slotW + left + right;

  const yFor = (v: number) => top + plotH - (v / maxAxis) * plotH;

  const gridlines: number[] = [];
  for (let v = 0; v <= maxAxis; v += step) gridlines.push(v);

  return (
    <div className="unread-chart-scroll">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="unread-chart">
        {gridlines.map((v) => (
          <g key={v}>
            <line
              x1={left}
              y1={yFor(v)}
              x2={W - right}
              y2={yFor(v)}
              stroke="#ece4d6"
              strokeWidth={1}
            />
            <text x={left - 8} y={yFor(v) + 4} textAnchor="end" fontSize={11} fill="#948b7c">
              {v}
            </text>
          </g>
        ))}
        {series.map((s, i) => {
          const cx = left + i * slotW + slotW / 2;
          const barHeight = Math.max((s.total / maxAxis) * plotH, s.total > 0 ? 2 : 1);
          const y = yFor(s.total);
          return (
            <g key={`${s.year}-${s.month}`}>
              <rect
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={barHeight}
                rx={4}
                fill={s.isCurrent ? 'var(--clay)' : 'var(--teal)'}
                opacity={s.isCurrent ? 1 : 0.5}
              />
              <text
                x={cx}
                y={y - 7}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill={s.isCurrent ? 'var(--clay)' : 'var(--pine)'}
              >
                {s.total}
              </text>
              <text
                x={cx}
                y={H - 9}
                textAnchor="middle"
                fontSize={11}
                fontWeight={s.isCurrent ? 600 : 400}
                fill="#948b7c"
              >
                {MONTHS_SHORT[s.month - 1]} {String(s.year).slice(2)}
                {s.isCurrent ? ' *' : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function YearBreakdownChart({ data }: { data: UnreadYearInfo[] }) {
  const H = 220;
  const top = 22;
  const bottom = 30;
  const left = 38;
  const right = 10;
  const barW = 36;

  if (data.length === 0) {
    return <div className="loading-bar">Нет данных</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const step = niceStep(maxVal);
  const maxAxis = Math.ceil(maxVal / step) * step;
  const plotH = H - top - bottom;
  const slotW = Math.max(barW + 16, 56);
  const W = data.length * slotW + left + right;

  const yFor = (v: number) => top + plotH - (v / maxAxis) * plotH;

  const gridlines: number[] = [];
  for (let v = 0; v <= maxAxis; v += step) gridlines.push(v);

  return (
    <div className="unread-chart-scroll">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="unread-chart">
        {gridlines.map((v) => (
          <g key={v}>
            <line
              x1={left}
              y1={yFor(v)}
              x2={W - right}
              y2={yFor(v)}
              stroke="#ece4d6"
              strokeWidth={1}
            />
            <text x={left - 8} y={yFor(v) + 4} textAnchor="end" fontSize={11} fill="#948b7c">
              {v}
            </text>
          </g>
        ))}
        {data.map((d) => {
          const i = data.indexOf(d);
          const cx = left + i * slotW + slotW / 2;
          const barHeight = Math.max((d.count / maxAxis) * plotH, d.count > 0 ? 2 : 1);
          const y = yFor(d.count);
          const label = d.year !== null ? String(d.year) : 'нет';
          return (
            <g key={label}>
              <rect
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={barHeight}
                rx={4}
                fill="var(--clay)"
              />
              <text
                x={cx}
                y={y - 7}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill="var(--pine)"
              >
                {d.count}
              </text>
              <text
                x={cx}
                y={H - 9}
                textAnchor="middle"
                fontSize={11}
                fill="#948b7c"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
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
            <UnreadChart series={data.series} />
          </div>

          <div className="unread-card">
            <div className="unread-card-head">
              <h3 className="unread-card-title">Остатки по году покупки</h3>
            </div>
            <YearBreakdownChart data={data.yearBreakdown} />
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
