import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { rootStore } from '../stores/rootStore';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Category, Genre } from '../api/types';

function moveId(list: number[], fromId: number, toId: number): number[] {
  const from = list.indexOf(fromId);
  const to = list.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

const dragProps = (
  id: number,
  onStart: () => void,
  onSetOver: (id: number) => void,
  onDrop: (id: number) => void,
  onEnd: () => void,
) => ({
  draggable: true as const,
  onDragStart: (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
    onStart();
  },
  onDragOver: (e: React.DragEvent) => {
    e.preventDefault();
    onSetOver(id);
  },
  onDrop: (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(id);
  },
  onDragEnd: onEnd,
});

const GenreRow = observer(
  ({
    genre,
    counts,
  }: {
    genre: Genre;
    counts: (gid: number) => number;
  }) => {
    const { catalog } = rootStore;
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(genre.name);
    const [categoryId, setCategoryId] = useState(genre.categoryId ?? '');
    const [busy, setBusy] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const save = async () => {
      if (!name.trim()) {
        setError('Название обязательно');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await catalog.renameGenre(genre.id, name.trim(), categoryId === '' ? null : Number(categoryId));
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить жанр');
      } finally {
        setBusy(false);
      }
    };

    if (editing) {
      return (
        <div className="genre-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название жанра"
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Без категории</option>
              {catalog.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
              ✓
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
              ✕
            </button>
          </div>
          {error && <div className="error-banner">{error}</div>}
        </div>
      );
    }

    return (
      <div className="genre-row">
        <span className="genre-row-name">{genre.name}</span>
        <span className="genre-row-book-count">{counts(genre.id)} книг</span>
        <span className="genre-row-actions">
          <button className="icon-btn" title="Редактировать" onClick={() => setEditing(true)}>
            ✎
          </button>
          <button
            className="icon-btn danger"
            title="Удалить жанр"
            onClick={() => setDeleteConfirm(true)}
          >
            🗑
          </button>
        </span>
        {deleteConfirm && (
          <ConfirmDialog
            title="Удалить жанр?"
            message={`Жанр «${genre.name}» будет удалён. Книги не удалятся — они просто останутся без этого жанра.`}
            onConfirm={() => catalog.removeGenre(genre.id)}
            onCancel={() => setDeleteConfirm(false)}
          />
        )}
      </div>
    );
  },
);

const CategoryCard = observer(
  ({ category, counts }: { category: Category | null; counts: (gid: number) => number }) => {
    const { catalog } = rootStore;
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(category?.name ?? '');
    const [newGenre, setNewGenre] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const genreList = catalog.genres.filter((g) => g.categoryId === (category?.id ?? null));
    const [dragGenre, setDragGenre] = useState<number | null>(null);
    const [overGenre, setOverGenre] = useState<number | null>(null);

    const handleGenreDrop = (overId: number) => {
      if (dragGenre == null || dragGenre === overId) return;
      const order = genreList.map((g) => g.id);
      catalog.setGenreOrder(moveId(order, dragGenre, overId));
      setDragGenre(null);
      setOverGenre(null);
    };

    const addGenre = async () => {
      if (!newGenre.trim()) return;
      setBusy(true);
      setError(null);
      try {
        await catalog.addGenre(newGenre.trim(), category?.id ?? null);
        setNewGenre('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось добавить жанр');
      } finally {
        setBusy(false);
      }
    };

    const rename = async () => {
      if (!category) return;
      if (!name.trim()) {
        setError('Название обязательно');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await catalog.renameCategory(category.id, name.trim());
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить категорию');
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="catalog-card">
        <div className="catalog-card-header">
          {editing && category ? (
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название категории"
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={rename} disabled={busy}>
                ✓
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                ✕
              </button>
            </div>
          ) : (
            <>
              <h3 className="catalog-card-title">
                {category ? category.name : 'Без категории'}
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    fontWeight: 400,
                    color: 'var(--muted)',
                    marginLeft: 8,
                  }}
                >
                  {genreList.length} жанр.
                </span>
              </h3>
              <span className="catalog-card-actions">
                {category && (
                  <button className="icon-btn" title="Переименовать" onClick={() => setEditing(true)}>
                    ✎
                  </button>
                )}
                {category && (
                  <button
                    className="icon-btn danger"
                    title="Удалить категорию"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    🗑
                  </button>
                )}
              </span>
            </>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {genreList.map((genre) => (
            <div
              key={genre.id}
              className={`drag-item drag-row ${dragGenre === genre.id ? 'dragging' : ''} ${
                dragGenre != null && overGenre === genre.id ? 'drop-target' : ''
              }`}
              {...dragProps(
                genre.id,
                () => setDragGenre(genre.id),
                setOverGenre,
                handleGenreDrop,
                () => {
                  setDragGenre(null);
                  setOverGenre(null);
                },
              )}
            >
              <GenreRow genre={genre} counts={counts} />
            </div>
          ))}
        </div>

        <div className="catalog-card-add" style={{ marginTop: 10 }}>
          <input
            placeholder="Новый жанр…"
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGenre()}
          />
          <button className="btn btn-outline btn-sm" onClick={addGenre} disabled={busy}>
            + Добавить
          </button>
        </div>

        {deleteConfirm && category && (
          <ConfirmDialog
            title="Удалить категорию?"
            message={`Категория «${category.name}» будет удалена вместе со своими жанрами. Книги не удалятся — они останутся без категории и жанра.`}
            onConfirm={() => catalog.removeCategory(category.id)}
            onCancel={() => setDeleteConfirm(false)}
          />
        )}
      </div>
    );
  },
);

const CategoriesPage = observer(() => {
  const { catalog, books } = rootStore;
  const [newCategory, setNewCategory] = useState('');
  const [dragCat, setDragCat] = useState<number | null>(null);
  const [overCat, setOverCat] = useState<number | null>(null);

  useEffect(() => {
    books.resetFilters();
    books.load();
  }, []);

  const handleCatDrop = (overId: number) => {
    if (dragCat == null || dragCat === overId) return;
    const order = catalog.categories.map((c) => c.id);
    catalog.setCategoryOrder(moveId(order, dragCat, overId));
    setDragCat(null);
    setOverCat(null);
  };

  const countsByGenre = new Map<number, number>();
  for (const book of books.books) {
    if (book.genreId != null) {
      countsByGenre.set(book.genreId, (countsByGenre.get(book.genreId) ?? 0) + 1);
    }
  }
  const counts = (gid: number) => countsByGenre.get(gid) ?? 0;

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await catalog.addCategory(newCategory.trim());
    setNewCategory('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Категории и жанры</h1>
          <p className="page-subtitle">
            Жанр является подразделом категории. Удаление жанра или категории не удаляет книги.
            <br />
            Перетащите категории и жанры, чтобы изменить их порядок.
          </p>
        </div>
      </div>

      <div className="catalog-toolbar">
        <div className="catalog-card-add" style={{ width: 'min(380px, 100%)', margin: 0 }}>
          <input
            placeholder="Новая категория…"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <button className="btn btn-accent" onClick={addCategory}>
            + Добавить
          </button>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {catalog.categories.length} категорий · {catalog.genres.length} жанров
        </div>
      </div>

      {catalog.loading ? (
        <div className="loading-bar">Загрузка…</div>
      ) : (
        <div className="catalog-grid">
          {catalog.categories.map((category) => (
            <div
              key={category.id}
              className={`drag-item drag-card ${dragCat === category.id ? 'dragging' : ''} ${
                dragCat != null && overCat === category.id ? 'drop-target' : ''
              }`}
              {...dragProps(
                category.id,
                () => setDragCat(category.id),
                setOverCat,
                handleCatDrop,
                () => {
                  setDragCat(null);
                  setOverCat(null);
                },
              )}
            >
              <CategoryCard category={category} counts={counts} />
            </div>
          ))}
          {catalog.genres.some((g) => g.categoryId === null) && (
            <CategoryCard category={null} counts={counts} />
          )}
          {catalog.categories.length === 0 && !catalog.genres.some((g) => g.categoryId === null) && (
            <div className="catalog-empty">
              Справочник пока пуст. Создайте первую категорию и добавьте в неё жанры.
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default CategoriesPage;
