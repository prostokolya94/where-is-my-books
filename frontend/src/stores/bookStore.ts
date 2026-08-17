import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import { EMPTY_TAB_FILTERS, type Book, type TabFilters } from '../api/types';

export const PAGE_SIZE_OPTIONS = [15, 30, 45, 60];

export class BookStore {
  books: Book[] = [];
  filters: TabFilters = { ...EMPTY_TAB_FILTERS };
  loading = false;
  error: string | null = null;
  page = 1;
  total = 0;
  pageSize = 30;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get filteredCount(): number {
    return this.total;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  setFilters(filters: Partial<TabFilters>): void {
    this.filters = { ...this.filters, ...filters };
    this.page = 1;
  }

  resetFilters(): void {
    this.filters = { ...EMPTY_TAB_FILTERS };
    this.page = 1;
  }

  setPage(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages);
    if (clamped === this.page) return;
    this.page = clamped;
    this.load();
  }

  setPageSize(size: number): void {
    if (size === this.pageSize) return;
    if (!PAGE_SIZE_OPTIONS.includes(size)) return;
    this.pageSize = size;
    this.page = 1;
    this.load();
  }

  applyFiltersImmediately(): void {
    this.page = 1;
    this.load();
  }

  applyFiltersDebounced(): void {
    this.page = 1;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.load();
    }, 250);
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const result = await api.getBooks(this.filters, {
        offset: (this.page - 1) * this.pageSize,
        limit: this.pageSize,
      });
      let pageAdjusted = false;
      runInAction(() => {
        this.total = result.total;
        const maxPage = Math.max(1, Math.ceil(result.total / this.pageSize));
        if (this.page > maxPage) {
          this.page = maxPage;
          pageAdjusted = true;
        }
        this.books = result.items;
      });
      if (pageAdjusted) {
        return await this.load();
      }
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
    await this.load();
  }
}