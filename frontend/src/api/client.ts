import type {
  AuthResult,
  Book,
  Category,
  DumpInfo,
  AdminUser,
  EventSummaryRow,
  Genre,
  PaginatedBooks,
  PlanRow,
  PlanRowPatch,
  PlanSubrowMutationResult,
  PlanSubrowPatch,
  PlanYear,
  StatsResponse,
  Tab,
  TabFilters,
  UnreadOverview,
  ReadOverview,
  CostAccountFilters,
  CostAccountView,
  CostSummary,
  LoginPayload,
  RegisterPayload,
} from './types';

const TOKEN_KEY = 'wimb_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function isAuthUrl(url: string): boolean {
  return url.startsWith('/api/auth/');
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const isFormBody = init?.body instanceof FormData;
  if (!isFormBody) headers['Content-Type'] = 'application/json';
  if (init?.headers && typeof init.headers === 'object' && !(init.headers instanceof Headers)) {
    Object.assign(headers, init.headers);
  }

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    if (res.status === 401 && !isAuthUrl(url)) {
      setToken(null);
      window.dispatchEvent(new Event('wimb:unauthorized'));
    }
    let message = `Ошибка ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) {
        message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function requestBlob(
  url: string,
  init?: RequestInit,
): Promise<{ data: Blob; fileName: string }> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new Event('wimb:unauthorized'));
    }
    throw new Error(`Ошибка ${res.status}`);
  }
  const data = await res.blob();
  const cd = res.headers.get('Content-Disposition') || '';
  const match = cd.match(/filename\*=UTF-8''([^;]+)/);
  const fallback = cd.match(/filename="?([^";]+)/);
  const fileName = match
    ? decodeURIComponent(match[1])
    : fallback?.[1] || `books-${Date.now()}.sqlite`;
  return { data, fileName };
}

function toQuery(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export const api = {
  register: (data: RegisterPayload) =>
    request<AuthResult>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: LoginPayload) =>
    request<AuthResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => request<{ id: number; login: string; fullName: string; canDownloadHisOwnDataBase: boolean; isAdmin: boolean }>('/api/auth/me'),

  getAdminUsers: () => request<AdminUser[]>('/api/admin/users'),
  updateAdminUser: (id: number, data: { isAdmin?: boolean; canDownloadHisOwnDataBase?: boolean }) =>
    request<AdminUser>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getAdminEventSummary: (from?: string, to?: string, userId?: number) =>
    request<EventSummaryRow[]>(
      `/api/admin/events/summary${toQuery({
        from,
        to,
        userId: userId !== undefined ? String(userId) : undefined,
      })}`,
    ),
  getAdminEventBreakdown: (
    type: string,
    from?: string,
    to?: string,
    userId?: number,
  ) =>
    request<EventSummaryRow[]>(
      `/api/admin/events/breakdown${toQuery({
        type,
        key: 'page',
        from,
        to,
        userId: userId !== undefined ? String(userId) : undefined,
      })}`,
    ),
  trackEvent: (type: string, payload?: Record<string, unknown>) =>
    request<{ ok: boolean }>('/api/events', {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
    }),

  getCategories: () => request<Category[]>('/api/categories'),
  createCategory: (data: { name: string }) =>
    request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: number, data: { name: string }) =>
    request<Category>(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  reorderCategories: (ids: number[]) =>
    request<void>('/api/categories/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),
  deleteCategory: (id: number) =>
    request<void>(`/api/categories/${id}`, { method: 'DELETE' }),

  getGenres: () => request<Genre[]>('/api/genres'),
  createGenre: (data: { name: string; categoryId: number | null }) =>
    request<Genre>('/api/genres', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateGenre: (id: number, data: { name: string; categoryId: number | null }) =>
    request<Genre>(`/api/genres/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  reorderGenres: (ids: number[]) =>
    request<void>('/api/genres/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),
  deleteGenre: (id: number) =>
    request<void>(`/api/genres/${id}`, { method: 'DELETE' }),

  getBooks: (filters?: TabFilters, pagination?: { offset: number; limit: number }) => {
    const query = toQuery({
      categories: filters?.categories?.length ? filters.categories.join(',') : undefined,
      genres: filters?.genres?.length ? filters.genres.join(',') : undefined,
      statuses: filters?.statuses?.length ? filters.statuses.join(',') : undefined,
      search: filters?.search?.trim() || undefined,
      offset: pagination ? String(pagination.offset) : undefined,
      limit: pagination ? String(pagination.limit) : undefined,
    });
    return request<PaginatedBooks>(`/api/books${query}`);
  },
  getAuthors: () => request<string[]>('/api/books/authors'),
  getAllBooks: () => request<Book[]>('/api/books/all'),
  createBook: (data: Partial<Book>) =>
    request<Book>('/api/books', { method: 'POST', body: JSON.stringify(data) }),
  updateBook: (id: number, data: Partial<Book>) =>
    request<Book>(`/api/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBook: (id: number) => request<void>(`/api/books/${id}`, { method: 'DELETE' }),

  getTabs: () => request<Tab[]>('/api/tabs'),
  createTab: (data: { name: string; filters?: TabFilters }) =>
    request<Tab>('/api/tabs', { method: 'POST', body: JSON.stringify(data) }),
  updateTab: (id: number, data: { name?: string; filters?: TabFilters }) =>
    request<Tab>(`/api/tabs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTab: (id: number) => request<void>(`/api/tabs/${id}`, { method: 'DELETE' }),

  getStats: () => request<StatsResponse>('/api/stats'),

  getPlans: () => request<PlanYear[]>('/api/plans'),
  createPlanYear: (year: number) =>
    request<PlanYear>('/api/plans/years', {
      method: 'POST',
      body: JSON.stringify({ year }),
    }),
  deletePlanYear: (id: number) =>
    request<void>(`/api/plans/years/${id}`, { method: 'DELETE' }),

  createPlanRow: (data: { yearId: number; name?: string; bookId?: number | null }) =>
    request<PlanRow>('/api/plans/rows', { method: 'POST', body: JSON.stringify(data) }),
  updatePlanRow: (id: number, data: PlanRowPatch) =>
    request<PlanRow>(`/api/plans/rows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePlanRow: (id: number) =>
    request<void>(`/api/plans/rows/${id}`, { method: 'DELETE' }),

  createPlanSubrow: (data: { rowId: number; name?: string; bookId?: number | null }) =>
    request<PlanSubrowMutationResult>('/api/plans/subrows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePlanSubrow: (id: number, data: PlanSubrowPatch) =>
    request<PlanSubrowMutationResult>(`/api/plans/subrows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePlanSubrow: (id: number) =>
    request<PlanSubrowMutationResult>(`/api/plans/subrows/${id}`, {
      method: 'DELETE',
    }),

  getUnreadOverview: () => request<UnreadOverview>('/api/unread'),
  setUnreadGenreTarget: (genreId: number, target: number | null) =>
    request<void>(`/api/unread/genres/${genreId}/target`, {
      method: 'PATCH',
      body: JSON.stringify({ target }),
    }),

  getReadOverview: () => request<ReadOverview>('/api/read'),

  getCostSummary: () => request<CostSummary>('/api/costs/summary'),
  createCostAccount: (data: { name: string } & CostAccountFilters) =>
    request<CostAccountView>('/api/costs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCostAccount: (id: number, data: { name: string } & CostAccountFilters) =>
    request<CostAccountView>(`/api/costs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCostAccount: (id: number) =>
    request<void>(`/api/costs/${id}`, { method: 'DELETE' }),

  getDumps: () => request<DumpInfo[]>('/api/dumps'),
  createDump: () => request<DumpInfo[]>('/api/dumps', { method: 'POST' }),
  deleteDump: (id: number) =>
    request<DumpInfo[]>(`/api/dumps/${id}`, { method: 'DELETE' }),
  applyDump: (id: number) =>
    request<void>(`/api/dumps/${id}/apply`, { method: 'POST' }),
  downloadDump: (id: number) => requestBlob(`/api/dumps/${id}/download`),
  uploadDump: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<DumpInfo[]>('/api/dumps/upload', {
      method: 'POST',
      body: form,
      headers: {},
    });
  },
};