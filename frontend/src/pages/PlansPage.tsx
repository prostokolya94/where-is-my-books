import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../stores/rootStore';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Book, PlanRow, PlanSubrow, PlanYear } from '../api/types';

function PlanNameInput({
  value,
  placeholder,
  autoFocus,
  onCommit,
}: {
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onCommit: (name: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <input
      className="plan-name-input"
      value={draft}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft.trim() !== value) onCommit(draft.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
      }}
    />
  );
}

function PlanBookSelect({
  value,
  books,
  onCommit,
}: {
  value: number | null;
  books: Book[];
  onCommit: (bookId: number | null) => void;
}) {
  return (
    <select
      className="plan-book-select"
      value={value ?? ''}
      onChange={(e) =>
        onCommit(e.target.value === '' ? null : Number(e.target.value))
      }
    >
      <option value="">— книга не привязана —</option>
      {books.map((b) => (
        <option key={b.id} value={b.id}>
          {b.title}
          {b.author ? ` (${b.author})` : ''}
        </option>
      ))}
    </select>
  );
}

interface SubrowProps {
  subrow: PlanSubrow;
  books: Book[];
  busy: boolean;
  autoFocus?: boolean;
  onRename: (id: number, name: string) => void;
  onToggle: (id: number, purchased: boolean) => void;
  onLink: (id: number, bookId: number | null) => void;
  onDelete: (subrow: PlanSubrow) => void;
}

const PlanSubrowItem = observer(
  ({
    subrow,
    books,
    busy,
    autoFocus,
    onRename,
    onToggle,
    onLink,
    onDelete,
  }: SubrowProps) => (
    <div className={`plan-subrow ${subrow.purchased ? 'purchased' : ''}`}>
      <label className="plan-check" title={subrow.purchased ? 'Куплена' : 'Не куплена'}>
        <input
          type="checkbox"
          checked={subrow.purchased}
          disabled={busy}
          onChange={(e) => onToggle(subrow.id, e.target.checked)}
        />
      </label>
      <PlanNameInput
        value={subrow.name}
        placeholder="Название подстроки…"
        autoFocus={autoFocus}
        onCommit={(name) => onRename(subrow.id, name)}
      />
      <PlanBookSelect
        value={subrow.bookId}
        books={books}
        onCommit={(bookId) => onLink(subrow.id, bookId)}
      />
      <button
        className="icon-btn danger"
        title="Удалить подстроку"
        disabled={busy}
        onClick={() => onDelete(subrow)}
      >
        🗑
      </button>
    </div>
  ),
);

interface RowProps {
  row: PlanRow;
  books: Book[];
  busy: boolean;
  focusRowId: number | null;
  focusSubrowId: number | null;
  onRename: (id: number, name: string) => void;
  onToggle: (id: number, purchased: boolean) => void;
  onLink: (id: number, bookId: number | null) => void;
  onDelete: (row: PlanRow) => void;
  onAddSubrow: (rowId: number) => void;
  onRenameSubrow: (id: number, name: string) => void;
  onToggleSubrow: (id: number, purchased: boolean) => void;
  onLinkSubrow: (id: number, bookId: number | null) => void;
  onDeleteSubrow: (subrow: PlanSubrow) => void;
}

const PlanRowItem = observer(
  ({
    row,
    books,
    busy,
    focusRowId,
    focusSubrowId,
    onRename,
    onToggle,
    onLink,
    onDelete,
    onAddSubrow,
    onRenameSubrow,
    onToggleSubrow,
    onLinkSubrow,
    onDeleteSubrow,
  }: RowProps) => {
    const hasSubrows = row.subrows.length > 0;
    return (
      <div className={`plan-row ${row.purchased ? 'purchased' : ''}`}>
        <div className="plan-row-head">
          <label
            className={`plan-check ${hasSubrows ? 'plan-check-auto' : ''}`}
            title={
              hasSubrows
                ? 'Отмечается автоматически, когда куплены все подстроки'
                : row.purchased
                  ? 'Куплена'
                  : 'Не куплена'
            }
          >
            <input
              type="checkbox"
              checked={row.purchased}
              disabled={hasSubrows || busy}
              onChange={(e) => onToggle(row.id, e.target.checked)}
            />
          </label>
          <PlanNameInput
            value={row.name}
            placeholder="Название строки…"
            autoFocus={row.id === focusRowId}
            onCommit={(name) => onRename(row.id, name)}
          />
          <PlanBookSelect
            value={row.bookId}
            books={books}
            onCommit={(bookId) => onLink(row.id, bookId)}
          />
          <button
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => onAddSubrow(row.id)}
          >
            + Подстрока
          </button>
          <button
            className="icon-btn danger"
            title="Удалить строку"
            disabled={busy}
            onClick={() => onDelete(row)}
          >
            🗑
          </button>
        </div>
        {hasSubrows && (
          <div className="plan-subrows">
            {row.subrows.map((s) => (
              <PlanSubrowItem
                key={s.id}
                subrow={s}
                books={books}
                busy={busy}
                autoFocus={s.id === focusSubrowId}
                onRename={onRenameSubrow}
                onToggle={onToggleSubrow}
                onLink={onLinkSubrow}
                onDelete={onDeleteSubrow}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);

const PlansPage = observer(() => {
  const { plans } = rootStore;
  const [yearDraft, setYearDraft] = useState(false);
  const [yearValue, setYearValue] = useState('');
  const [focusRowId, setFocusRowId] = useState<number | null>(null);
  const [focusSubrowId, setFocusSubrowId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteYear, setDeleteYear] = useState<PlanYear | null>(null);
  const [deleteRow, setDeleteRow] = useState<PlanRow | null>(null);
  const [deleteSubrow, setDeleteSubrow] = useState<PlanSubrow | null>(null);

  useEffect(() => {
    plans.load();
  }, []);

  const year = plans.activeYear;

  const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    try {
      return await fn();
    } finally {
      setBusy(false);
    }
  };

  const addYear = () => {
    const num = Number(yearValue);
    if (!Number.isInteger(num) || num < 1000 || num > 9999) return;
    void run(() => plans.createYear(num)).then(() => {
      setYearDraft(false);
      setYearValue('');
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            План покупок
            <span className="count">{year ? `${year.rows.length} строк` : '—'}</span>
          </h1>
          <p className="page-subtitle">
            Строки и подстроки можно привязывать к книгам из каталога — статус покупки
            синхронизируется в обе стороны.
          </p>
        </div>
      </div>

      {plans.error && <div className="error-banner">{plans.error}</div>}

      <div className="plan-year-tabs">
        {plans.years.map((y) => (
          <div
            key={y.id}
            className={`plan-year-tab ${y.id === year?.id ? 'active' : ''}`}
            onClick={() => plans.selectYear(y.id)}
          >
            <span>{y.year}</span>
            <button
              className="plan-year-tab-close"
              title="Удалить год"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteYear(y);
              }}
            >
              ×
            </button>
          </div>
        ))}
        {yearDraft ? (
          <div className="plan-year-draft">
            <input
              autoFocus
              type="number"
              value={yearValue}
              placeholder="2027"
              onChange={(e) => setYearValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addYear();
                if (e.key === 'Escape') setYearDraft(false);
              }}
            />
            <button className="btn btn-accent btn-sm" onClick={addYear}>
              Добавить
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setYearDraft(false)}>
              Отмена
            </button>
          </div>
        ) : (
          <button className="plan-year-add" onClick={() => setYearDraft(true)}>
            + Год
          </button>
        )}
      </div>

      {plans.loading ? (
        <div className="loading-bar">Загрузка…</div>
      ) : !year ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗓</div>
          <div className="empty-state-title">Нет ни одного года в плане</div>
          <p className="empty-state-text">
            Создайте год, чтобы начать вести план покупок на календарный год.
          </p>
        </div>
      ) : year.rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">В {year.year} году пока нет строк</div>
          <p className="empty-state-text">
            Добавьте первую строку — например, книгу, которую планируете купить.
          </p>
          <button
            className="btn btn-accent"
            disabled={busy}
            onClick={() =>
              void run(() => plans.addRow(year.id)).then((id) => setFocusRowId(id ?? null))
            }
          >
            + Добавить строку
          </button>
        </div>
      ) : (
        <div className="plan-list">
          {year.rows.map((row) => (
            <PlanRowItem
              key={row.id}
              row={row}
              books={plans.books}
              busy={busy}
              focusRowId={focusRowId}
              focusSubrowId={focusSubrowId}
              onRename={(id, name) => void run(() => plans.renameRow(id, name))}
              onToggle={(id, p) => void run(() => plans.toggleRow(id, p))}
              onLink={(id, bookId) => void run(() => plans.linkRowBook(id, bookId))}
              onDelete={setDeleteRow}
              onAddSubrow={(rowId) =>
                void run(() => plans.addSubrow(rowId)).then((id) => setFocusSubrowId(id ?? null))
              }
              onRenameSubrow={(id, name) => void run(() => plans.renameSubrow(id, name))}
              onToggleSubrow={(id, p) => void run(() => plans.toggleSubrow(id, p))}
              onLinkSubrow={(id, bookId) => void run(() => plans.linkSubrowBook(id, bookId))}
              onDeleteSubrow={setDeleteSubrow}
            />
          ))}
          <button
            className="btn btn-outline plan-add-row"
            disabled={busy}
            onClick={() =>
              void run(() => plans.addRow(year.id)).then((id) => setFocusRowId(id ?? null))
            }
          >
            + Добавить строку
          </button>
        </div>
      )}

      {deleteYear && (
        <ConfirmDialog
          title="Удалить год?"
          message={`План покупок за ${deleteYear.year} год (${deleteYear.rows.length} строк) будет удалён безвозвратно.`}
          onConfirm={() => plans.removeYear(deleteYear.id)}
          onCancel={() => setDeleteYear(null)}
        />
      )}
      {deleteRow && (
        <ConfirmDialog
          title="Удалить строку?"
          message={`Строка «${deleteRow.name || 'Без названия'}» и её подстроки будут удалены безвозвратно.`}
          onConfirm={() => plans.removeRow(deleteRow.id)}
          onCancel={() => setDeleteRow(null)}
        />
      )}
      {deleteSubrow && (
        <ConfirmDialog
          title="Удалить подстроку?"
          message={`Подстрока «${deleteSubrow.name || 'Без названия'}» будет удалена безвозвратно.`}
          onConfirm={() => plans.removeSubrow(deleteSubrow.id)}
          onCancel={() => setDeleteSubrow(null)}
        />
      )}
    </div>
  );
});

export default PlansPage;
