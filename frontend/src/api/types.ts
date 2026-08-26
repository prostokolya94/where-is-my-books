export type BookStatus = 'read' | 'bought' | 'wishlist';

export const BOOK_STATUSES: BookStatus[] = ['read', 'bought', 'wishlist'];

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  read: 'Прочитана',
  bought: 'Куплена, не прочитана',
  wishlist: 'В списке желаемого',
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

export interface PaginatedBooks {
  items: Book[];
  total: number;
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

export interface StatsGenreCount {
  genreId: number | null;
  genreName: string;
  count: number;
}

export interface StatsCategoryTable {
  categoryId: number | null;
  categoryName: string;
  genres: StatsGenreCount[];
  total: number;
}

export interface StatsResponse {
  tables: StatsCategoryTable[];
  total: number;
  statusTotals: Record<BookStatus, number>;
}

export interface PlanBookRef {
  id: number;
  title: string;
}

export interface PlanSubrow {
  id: number;
  rowId: number;
  name: string;
  purchased: boolean;
  bookId: number | null;
  book: PlanBookRef | null;
  sortOrder: number;
}

export interface PlanRow {
  id: number;
  yearId: number;
  name: string;
  purchased: boolean;
  bookId: number | null;
  book: PlanBookRef | null;
  sortOrder: number;
  subrows: PlanSubrow[];
}

export interface PlanYear {
  id: number;
  year: number;
  sortOrder: number;
  rows: PlanRow[];
}

export interface PlanSubrowMutationResult {
  row: PlanRow;
  subrow?: PlanSubrow;
}

export interface PlanRowPatch {
  name?: string;
  purchased?: boolean;
  bookId?: number | null;
}

export interface PlanSubrowPatch {
  name?: string;
  purchased?: boolean;
  bookId?: number | null;
}

export interface UnreadSeriesPoint {
  year: number;
  month: number;
  total: number;
  isCurrent: boolean;
}

export interface UnreadCategoryInfo {
  categoryId: number | null;
  name: string;
  count: number;
}

export interface UnreadGenreInfo {
  genreId: number | null;
  name: string;
  categoryId: number | null;
  categoryName: string;
  count: number;
  target: number | null;
}

export interface UnreadYearInfo {
  year: number | null;
  count: number;
}

export interface UnreadOverview {
  series: UnreadSeriesPoint[];
  total: { current: number; previousMonth: number | null };
  categories: UnreadCategoryInfo[];
  genres: UnreadGenreInfo[];
  yearBreakdown: UnreadYearInfo[];
  generatedAt: string;
}

export interface BackupInfo {
  name: string;
  size: number;
  createdAt: string;
}

export interface CreateBackupResult {
  backups: BackupInfo[];
  deleted: string | null;
}
