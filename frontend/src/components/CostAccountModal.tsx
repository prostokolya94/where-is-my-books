import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import { rootStore } from '../stores/rootStore';
import {
  BOOK_STATUS_LABELS,
  type BookStatus,
  type CostAccountFilters,
  type CostAccountView,
} from '../api/types';

const COST_STATUSES: BookStatus[] = ['read', 'bought'];

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
}

function toggleStatus(list: BookStatus[], status: BookStatus): BookStatus[] {
  return list.includes(status)
    ? list.filter((v) => v !== status)
    : [...list, status];
}

export function describeFilters(filters: CostAccountFilters): string {
  const parts: string[] = [];
  if (filters.statuses.length === 1) {
    parts.push(BOOK_STATUS_LABELS[filters.statuses[0]]);
  } else {
    parts.push('Все доступные (не из желаемого)');
  }
  const from = filters.purchaseYearFrom;
  const to = filters.purchaseYearTo;
  if (from != null && to != null) parts.push(`год покупки ${from}–${to}`);
  else if (from != null) parts.push(`год покупки с ${from}`);
  else if (to != null) parts.push(`год покупки до ${to}`);
  else parts.push('любой год покупки');
  const hasCats = filters.categories.length > 0;
  const hasGens = filters.genres.length > 0;
  if (!hasCats && !hasGens) parts.push('все категории и жанры');
  return parts.join(' · ');
}

interface Props {
  account: CostAccountView | null;
  onClose: () => void;
}

const CostAccountModal = observer(({ account, onClose }: Props) => {
  const { catalog, costs } = rootStore;
  const [name, setName] = useState(account?.name ?? '');
  const [categories, setCategories] = useState<number[]>(account?.filters.categories ?? []);
  const [genres, setGenres] = useState<number[]>(account?.filters.genres ?? []);
  const [statuses, setStatuses] = useState<BookStatus[]>(account?.filters.statuses ?? []);
  const [purchaseYearFrom, setPurchaseYearFrom] = useState<number | null>(
    account?.filters.purchaseYearFrom ?? null,
  );
  const [purchaseYearTo, setPurchaseYearTo] = useState<number | null>(
    account?.filters.purchaseYearTo ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 60; y--) years.push(y);
    return years;
  }, []);

  const genresByCategory = useMemo(() => {
    const map = new Map<number | null, typeof catalog.genres>();
    for (const g of catalog.genres) {
      const key = g.categoryId ?? null;
      const list = map.get(key) ?? [];
      list.push(g);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }
    return map;
  }, [catalog.genres]);

  const filtered = {
    categories,
    genres,
    statuses,
    purchaseYearFrom,
    purchaseYearTo,
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Название счёта обязательно');
      return;
    }
    setError(null);
    const payload = {
      name: name.trim(),
      categories,
      genres,
      statuses,
      purchaseYearFrom,
      purchaseYearTo,
    };
    try {
      if (account) {
        await costs.update(account.id, payload);
      } else {
        await costs.create(payload);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить счёт');
    }
  };

  return (
    <Modal
      title={account ? 'Редактировать счёт' : 'Новый счёт'}
      onClose={onClose}
      width={680}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={costs.saving}>
            Отмена
          </button>
          <button className="btn btn-accent" onClick={handleSubmit} disabled={costs.saving}>
            {costs.saving ? 'Сохранение…' : account ? 'Сохранить' : 'Создать'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}

      <div className="form-grid">
        <div className="form-field full">
          <label>Название *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Подарки 2024"
            autoFocus
          />
        </div>

        <div className="form-field full">
          <label>Статусы книг</label>
          <div className="cost-statuses">
            {COST_STATUSES.map((status) => (
              <label key={status} className="cost-check">
                <input
                  type="checkbox"
                  checked={statuses.includes(status)}
                  onChange={() => setStatuses(toggleStatus(statuses, status))}
                />
                <span>{BOOK_STATUS_LABELS[status]}</span>
              </label>
            ))}
            {statuses.length === 0 && (
              <span className="cell-muted">Выбраны оба статуса (всё, кроме списка желаемого)</span>
            )}
          </div>
        </div>

        <div className="form-field">
          <label>Год покупки — от</label>
          <select
            value={purchaseYearFrom ?? ''}
            onChange={(e) =>
              setPurchaseYearFrom(e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">Любой</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Год покупки — до</label>
          <select
            value={purchaseYearTo ?? ''}
            onChange={(e) =>
              setPurchaseYearTo(e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">Любой</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label>Категории и жанры</label>
        <div className="cost-tree">
          {catalog.categories.map((category) => {
            const catGenres = genresByCategory.get(category.id) ?? [];
            return (
              <div key={category.id} className="cost-tree-category">
                <label className="cost-tree-cat">
                  <input
                    type="checkbox"
                    checked={categories.includes(category.id)}
                    onChange={() => setCategories(toggleId(categories, category.id))}
                  />
                  <strong>{category.name}</strong>
                </label>
                {catGenres.map((genre) => (
                  <label key={genre.id} className="cost-tree-genre">
                    <input
                      type="checkbox"
                      checked={genres.includes(genre.id)}
                      onChange={() => setGenres(toggleId(genres, genre.id))}
                    />
                    <span>{genre.name}</span>
                  </label>
                ))}
              </div>
            );
          })}
          {(genresByCategory.get(null) ?? []).length > 0 && (
            <div className="cost-tree-category">
              <div className="cost-tree-cat">
                <strong>Без категории</strong>
              </div>
              {(genresByCategory.get(null) ?? []).map((genre) => (
                <label key={genre.id} className="cost-tree-genre">
                  <input
                    type="checkbox"
                    checked={genres.includes(genre.id)}
                    onChange={() => setGenres(toggleId(genres, genre.id))}
                  />
                  <span>{genre.name}</span>
                </label>
              ))}
            </div>
          )}
          {catalog.categories.length === 0 && genresByCategory.size === 0 && (
            <div className="cell-muted">Справочник пуст — добавьте категории и жанры.</div>
          )}
          {categories.length === 0 && genres.length === 0 && (
            <div className="cell-muted" style={{ marginTop: 6 }}>
              Ничего не выбрано — в счёт попадут все книги по выбранным статусам и годам.
            </div>
          )}
        </div>
      </div>

      <div className="cost-preview">
        <span className="cost-preview-label">Описание счёта:</span>
        <span className="cost-preview-text">
          «{name.trim() || 'Без названия'}» — {describeFilters(filtered)}
        </span>
      </div>
    </Modal>
  );
});

export default CostAccountModal;