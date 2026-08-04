import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../stores/rootStore';
import MultiSelect from './MultiSelect';
import StatusBadge from './StatusBadge';
import BookFormModal from './BookFormModal';
import ConfirmDialog from './ConfirmDialog';
import {
  BOOK_STATUS_LABELS,
  BOOK_STATUSES,
  EMPTY_TAB_FILTERS,
  type Book,
  type TabFilters,
} from '../api/types';

interface Props {
  title: string;
  subtitle?: string;
  initialFilters?: TabFilters;
  showSavePreset?: boolean;
  onSavePreset?: (filters: TabFilters) => void;
}

const BookListView = observer(
  ({ title, subtitle, initialFilters, showSavePreset, onSavePreset }: Props) => {
    const { books, catalog } = rootStore;
    const [modalBook, setModalBook] = useState<Book | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

    useEffect(() => {
      books.setFilters(initialFilters ? { ...initialFilters } : { ...EMPTY_TAB_FILTERS });
      books.load();
    }, []);

    const hasFilters =
      books.filters.search.trim() !== '' ||
      books.filters.categories.length > 0 ||
      books.filters.genres.length > 0 ||
      books.filters.statuses.length > 0;

    const categoryOptions = catalog.categories.map((c) => ({ value: c.id, label: c.name }));

    const genreOptions = catalog.genres.map((g) => ({
      value: g.id,
      label: g.name,
      group:
        g.categoryId !== null
          ? (catalog.categoryById.get(g.categoryId)?.name ?? 'Без категории')
          : 'Без категории',
    }));

    const statusOptions = BOOK_STATUSES.map((s, i) => ({
      value: i,
      label: BOOK_STATUS_LABELS[s],
    }));

    const updateFilters = (patch: Partial<TabFilters>) => {
      books.setFilters(patch);
      if (patch.search !== undefined) {
        books.applyFiltersDebounced();
      } else {
        books.applyFiltersImmediately();
      }
    };

    const reset = () => {
      books.resetFilters();
      books.applyFiltersImmediately();
    };

    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              {title}
              <span className="count">{books.filteredCount} шт.</span>
            </h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          <div className="page-actions">
            {showSavePreset && onSavePreset && (
              <button className="btn btn-outline" onClick={() => onSavePreset(books.filters)}>
                Сохранить пресет
              </button>
            )}
            <button className="btn btn-accent" onClick={() => setModalOpen(true)}>
              + Добавить книгу
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="filter-search">
            <span className="filter-search-icon">🔍</span>
            <input
              placeholder="Поиск по названию или автору…"
              value={books.filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
          </div>
          <MultiSelect
            label="Категории"
            options={categoryOptions}
            selected={books.filters.categories}
            onChange={(categories) => updateFilters({ categories })}
            allowAll
          />
          <MultiSelect
            label="Жанры"
            options={genreOptions}
            selected={books.filters.genres}
            onChange={(genres) => updateFilters({ genres })}
            allowAll
            showGroups
          />
          <MultiSelect
            label="Статус"
            options={statusOptions}
            selected={books.filters.statuses.map((s) => BOOK_STATUSES.indexOf(s))}
            onChange={(values) => updateFilters({ statuses: values.map((v) => BOOK_STATUSES[v]) })}
            allowAll
          />
          {hasFilters && (
            <button className="filter-reset" onClick={reset}>
              ✕ Сбросить
            </button>
          )}
        </div>

        {books.error && <div className="error-banner">{books.error}</div>}

        <div className="table-card">
          {books.loading ? (
            <div className="loading-bar">Загрузка…</div>
          ) : books.books.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📖</div>
              <div className="empty-state-title">
                {hasFilters ? 'По этим условиям ничего не нашлось' : 'В библиотеке пока пусто'}
              </div>
              <p className="empty-state-text">
                {hasFilters
                  ? 'Попробуйте смягчить фильтры или сбросить их.'
                  : 'Добавьте первую книгу, чтобы начать вести каталог.'}
              </p>
              {!hasFilters && (
                <button className="btn btn-accent" onClick={() => setModalOpen(true)}>
                  + Добавить книгу
                </button>
              )}
            </div>
          ) : (
            <table className="books-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Книга</th>
                  <th>Категория</th>
                  <th>Жанр</th>
                  <th>Год покупки</th>
                  <th>Статус</th>
                  <th>Стоимость</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {books.books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div className="cell-title">{book.title}</div>
                      {book.author && <div className="cell-author">{book.author}</div>}
                    </td>
                    <td>
                      {book.category?.name ? (
                        <span className="cell-muted">{book.category.name}</span>
                      ) : (
                        <span className="cell-muted" style={{ color: '#c0b6a6' }}>
                          —
                        </span>
                      )}
                    </td>
                    <td>
                      {book.genre?.name ? (
                        <span className="cell-muted">{book.genre.name}</span>
                      ) : (
                        <span className="cell-muted" style={{ color: '#c0b6a6' }}>
                          —
                        </span>
                      )}
                    </td>
                    <td className="cell-muted">{book.purchaseYear ?? '—'}</td>
                    <td>
                      <StatusBadge status={book.status} />
                    </td>
                    <td className="cell-muted">
                      {book.price != null ? `${book.price.toLocaleString('ru-RU')} ₽` : '—'}
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          className="icon-btn"
                          title="Редактировать"
                          onClick={() => {
                            setModalBook(book);
                            setModalOpen(true);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          className="icon-btn danger"
                          title="Удалить"
                          onClick={() => setDeleteTarget(book)}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {modalOpen && (
          <BookFormModal book={modalBook} onClose={() => setModalOpen(false)} />
        )}
        {deleteTarget && (
          <ConfirmDialog
            title="Удалить книгу?"
            message={`«${deleteTarget.title}» будет удалена из каталога безвозвратно.`}
            onConfirm={() => books.remove(deleteTarget.id)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    );
  },
);

export default BookListView;
