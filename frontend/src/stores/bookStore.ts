import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import { EMPTY_TAB_FILTERS, type Book, type TabFilters } from '../api/types';

export class BookStore {
  books: Book[] = [];
  filters: TabFilters = { ...EMPTY_TAB_FILTERS };
  loading = false;
  error: string | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get filteredCount(): number {
    return this.books.length;
  }

  setFilters(filters: Partial<TabFilters>): void {
    this.filters = { ...this.filters, ...filters };
  }

  resetFilters(): void {
    this.filters = { ...EMPTY_TAB_FILTERS };
  }

  applyFiltersImmediately(): void {
    this.load();
  }

  applyFiltersDebounced(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.load();
    }, 250);
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const books = await api.getBooks(this.filters);
      runInAction(() => {
        this.books = books;
      });
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e.message : 'Не удалось загрузить книги';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async create(book: Partial<Book>): Promise<void> {
    await api.createBook(book);
    await this.load();
  }

  async update(id: number, book: Partial<Book>): Promise<void> {
    await api.updateBook(id, book);
    await this.load();
  }

  async remove(id: number): Promise<void> {
    await api.deleteBook(id);
    runInAction(() => {
      this.books = this.books.filter((b) => b.id !== id);
    });
  }
}
