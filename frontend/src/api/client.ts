import type {
  Book,
  BookStatus,
  Category,
  Genre,
  PlanRow,
  PlanRowPatch,
  PlanSubrowMutationResult,
  PlanSubrowPatch,
  PlanYear,
  StatsResponse,
  Tab,
  TabFilters,
  UnreadOverview,
} from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `Ошибка ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) {
        message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function toQuery(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export const api = {
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

  getBooks: (filters?: TabFilters) => {
    const query = toQuery({
      categories: filters?.categories?.length ? filters.categories.join(',') : undefined,
      genres: filters?.genres?.length ? filters.genres.join(',') : undefined,
      statuses: filters?.statuses?.length ? filters.statuses.join(',') : undefined,
      search: filters?.search?.trim() || undefined,
    });
    return request<Book[]>(`/api/books${query}`);
  },
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

  getStats: (status?: BookStatus) =>
    request<StatsResponse>(`/api/stats${toQuery({ status: status ?? undefined })}`),

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
  setUnreadCategoryTarget: (categoryId: number, target: number | null) =>
    request<void>(`/api/unread/categories/${categoryId}/target`, {
      method: 'PATCH',
      body: JSON.stringify({ target }),
    }),
};
