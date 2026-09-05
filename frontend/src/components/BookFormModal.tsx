import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Modal from './Modal';
import { rootStore } from '../stores/rootStore';
import { api } from '../api/client';
import {
  BOOK_STATUS_LABELS,
  BOOK_STATUSES,
  type Book,
  type BookStatus,
} from '../api/types';

interface Props {
  book: Book | null;
  onClose: () => void;
}

const emptyForm = {
  title: '',
  author: '',
  purchaseYear: '',
  status: 'wishlist' as BookStatus,
  readYear: '',
  readMonth: '',
  categoryId: '' as string | number,
  genreId: '' as string | number,
  price: '',
};

const BookFormModal = observer(({ book, onClose }: Props) => {
  const { catalog, books } = rootStore;
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allAuthors, setAllAuthors] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAuthors().then(setAllAuthors).catch(() => setAllAuthors([]));
  }, []);

  const filteredAuthors = useMemo(() => {
    const q = form.author.trim().toLowerCase();
    if (!q) return [];
    return allAuthors.filter((a) => a.toLowerCase().includes(q));
  }, [allAuthors, form.author]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (book) {
      setForm({
        title: book.title,
        author: book.author,
        purchaseYear: book.purchaseYear?.toString() ?? '',
        status: book.status,
        readYear: book.readYear?.toString() ?? '',
        readMonth: book.readMonth?.toString() ?? '',
        categoryId: book.categoryId ?? '',
        genreId: book.genreId ?? '',
        price: book.price?.toString() ?? '',
      });
    } else {
      setForm({ ...emptyForm });
    }
    setError(null);
  }, [book]);

  const categoryId = form.categoryId === '' ? null : Number(form.categoryId);

  const genreOptions = useMemo(() => {
    let list = catalog.genres;
    if (categoryId !== null) {
      list = list.filter((g) => g.categoryId === categoryId || g.categoryId === null);
    }
    return list;
  }, [catalog.genres, categoryId]);

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Название обязательно');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        purchaseYear: form.purchaseYear ? Number(form.purchaseYear) : null,
        status: form.status,
        readYear: form.readYear ? Number(form.readYear) : null,
        readMonth: form.readMonth ? Number(form.readMonth) : null,
        categoryId: categoryId,
        genreId: form.genreId === '' ? null : Number(form.genreId),
        price: form.price !== '' ? Number(form.price) : null,
      };
      if (book) {
        await books.update(book.id, payload);
      } else {
        await books.create(payload);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить книгу');
    } finally {
      setBusy(false);
    }
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 60; y--) years.push(y);
    return years;
  }, []);

  const monthOptions = [
    { value: 1, label: 'Январь' },
    { value: 2, label: 'Февраль' },
    { value: 3, label: 'Март' },
    { value: 4, label: 'Апрель' },
    { value: 5, label: 'Май' },
    { value: 6, label: 'Июнь' },
    { value: 7, label: 'Июль' },
    { value: 8, label: 'Август' },
    { value: 9, label: 'Сентябрь' },
    { value: 10, label: 'Октябрь' },
    { value: 11, label: 'Ноябрь' },
    { value: 12, label: 'Декабрь' },
  ];

  return (
    <Modal
      title={book ? 'Редактировать книгу' : 'Новая книга'}
      onClose={onClose}
      width={600}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button className="btn btn-accent" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Сохранение…' : book ? 'Сохранить' : 'Добавить'}
          </button>
        </>
      }
    >
      {error && <div className="error-banner">{error}</div>}
      <div className="form-grid">
        <div className="form-field full">
          <label>Название *</label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Название книги"
            autoFocus
          />
        </div>
        <div className="form-field full" ref={wrapperRef} style={{ position: 'relative' }}>
          <label>Автор</label>
          <input
            value={form.author}
            onChange={(e) => {
              set('author', e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (form.author.trim()) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Автор"
            autoComplete="off"
          />
          {showSuggestions && filteredAuthors.length > 0 && (
            <div className="author-suggestions">
              {filteredAuthors.map((name) => (
                <div
                  key={name}
                  className="author-suggestion-item"
                  onMouseDown={() => {
                    set('author', name);
                    setShowSuggestions(false);
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="form-field">
          <label>Статус</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)}>
            {BOOK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BOOK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Год покупки</label>
          <select
            value={form.purchaseYear}
            onChange={(e) => set('purchaseYear', e.target.value)}
          >
            <option value="">Не указан</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Прочитана (месяц)</label>
          <select
            value={form.readMonth}
            onChange={(e) => set('readMonth', e.target.value)}
            disabled={form.status !== 'read'}
          >
            <option value="">Не указан</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Прочитана (год)</label>
          <select
            value={form.readYear}
            onChange={(e) => set('readYear', e.target.value)}
            disabled={form.status !== 'read'}
          >
            <option value="">Не указан</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Категория</label>
          <select
            value={form.categoryId}
            onChange={(e) => {
              set('categoryId', e.target.value);
              set('genreId', '');
            }}
          >
            <option value="">Без категории</option>
            {catalog.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Жанр</label>
          <select
            value={form.genreId}
            onChange={(e) => set('genreId', e.target.value)}
            disabled={genreOptions.length === 0}
          >
            <option value="">Без жанра</option>
            {genreOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Стоимость покупки, ₽</label>
          <input
            type="number"
            min="0"
            step="any"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    </Modal>
  );
});

export default BookFormModal;
