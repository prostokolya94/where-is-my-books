export type BookStatus = 'read' | 'bought' | 'wishlist' | 'abandoned';

export const BOOK_STATUSES: BookStatus[] = ['read', 'bought', 'wishlist', 'abandoned'];

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  read: 'Прочитана',
  bought: 'Куплена, не прочитана',
  wishlist: 'В списке желаемого',
  abandoned: 'Брошена',
};

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Genre {
  id: number;
  name: string;
  categoryId: number | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  purchaseYear: number | null;
  status: BookStatus;
  categoryId: number | null;
  genreId: number | null;
  price: number | null;
  createdAt?: string;
  updatedAt?: string;
  category?: Category | null;
  genre?: Genre | null;
}

export interface TabFilters {
  categories: number[];
  genres: number[];
  statuses: BookStatus[];
  search: string;
}

export const EMPTY_TAB_FILTERS: TabFilters = {
  categories: [],
  genres: [],
  statuses: [],
  search: '',
};

export interface Tab {
  id: number;
  name: string;
  sortOrder: number;
  filters: TabFilters;
}

export interface StatsColumn {
  id: number | null;
  name: string;
  total: number;
}

export interface StatsRow {
  genreId: number | null;
  genreName: string;
  genreCategoryId: number | null;
  total: number;
  byCategory: Record<string, number>;
}

export interface StatsResponse {
  columns: StatsColumn[];
  rows: StatsRow[];
  total: number;
  status: BookStatus | null;
  statusTotals: Record<BookStatus, number>;
}
