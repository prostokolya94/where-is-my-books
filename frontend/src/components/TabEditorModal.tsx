import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import MultiSelect from './MultiSelect';
import { uiStore } from '../stores/uiStore';
import { rootStore } from '../stores/rootStore';
import {
  BOOK_STATUS_LABELS,
  BOOK_STATUSES,
  EMPTY_TAB_FILTERS,
  type TabFilters,
} from '../api/types';

const TabEditorModal = observer(() => {
  const navigate = useNavigate();
  const { tabs, catalog } = rootStore;
  const [name, setName] = useState('');
  const [filters, setFilters] = useState<TabFilters>({ ...EMPTY_TAB_FILTERS });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = uiStore.tabEditorTarget;

  useEffect(() => {
    if (uiStore.tabEditorOpen) {
      setName(editing?.name ?? '');
      setFilters(editing ? { ...editing.filters } : { ...EMPTY_TAB_FILTERS });
      setError(null);
    }
  }, [uiStore.tabEditorOpen, editing]);

  if (!uiStore.tabEditorOpen) return null;

  const categoryOptions = catalog.categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const genreOptions = catalog.genres.map((g) => ({
    value: g.id,
    label: g.name,
    group: g.categoryId !== null ? (catalog.categoryById.get(g.categoryId)?.name ?? 'Без категории') : 'Без категории',
  }));

  const statusOptions = BOOK_STATUSES.map((s) => ({
    value: s as unknown as number,
    label: BOOK_STATUS_LABELS[s],
  }));

  const updateFilters = (patch: Partial<TabFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Название таба обязательно');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        await tabs.update(editing.id, { name: name.trim(), filters });
      } else {
        const created = await tabs.create(name.trim());
        uiStore.closeTabEditor();
        navigate(`/tabs/${created.id}`);
        return;
      }
      uiStore.closeTabEditor();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить таб');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Редактировать таб' : 'Новый таб'}
      onClose={() => uiStore.closeTabEditor()}
      width={560}
      footer={
        <>
          <button
            className="btn btn-outline"
            onClick={() => uiStore.closeTabEditor()}
            disabled={busy}
          >
            Отмена
          </button>
          <button className="btn btn-accent" onClick={handleSave} disabled={busy}>
            {busy ? 'Сохранение…' : 'Сохранить'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <div className="form-field full">
          <label>Название таба *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: «Летнее чтение»"
            autoFocus
          />
        </div>
        <div className="form-field full">
          <label>Пресет фильтров — книги таба выбираются из общего списка по этим условиям</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <MultiSelect
              label="Категории"
              options={categoryOptions}
              selected={filters.categories}
              onChange={(categories) => updateFilters({ categories })}
              allowAll
            />
            <MultiSelect
              label="Жанры"
              options={genreOptions}
              selected={filters.genres}
              onChange={(genres) => updateFilters({ genres })}
              allowAll
              showGroups
            />
            <MultiSelect
              label="Статус"
              options={statusOptions}
              selected={filters.statuses.map((s) => BOOK_STATUSES.indexOf(s as never))}
              onChange={(values) =>
                updateFilters({
                  statuses: values.map((v) => BOOK_STATUSES[v]),
                })
              }
              allowAll
            />
          </div>
        </div>
        <div className="form-field full">
          <label>Поиск по названию или автору</label>
          <input
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Подстрока из названия или автора"
          />
        </div>
      </div>
      <p className="form-hint" style={{ marginTop: 12 }}>
        Таб — это сохранённый набор фильтров. Он отбирает книги из общего списка: по категориям,
        жанрам, статусам и поиску.
      </p>
    </Modal>
  );
});

export default TabEditorModal;
