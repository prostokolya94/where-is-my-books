import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import type {
  Book,
  PlanRow,
  PlanSubrow,
  PlanSubrowMutationResult,
  PlanYear,
} from '../api/types';

export class PlanStore {
  years: PlanYear[] = [];
  books: Book[] = [];
  activeYearId: number | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get activeYear(): PlanYear | null {
    return this.years.find((y) => y.id === this.activeYearId) ?? null;
  }

  selectYear(id: number): void {
    this.activeYearId = id;
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const [years, books] = await Promise.all([api.getPlans(), api.getAllBooks()]);
      runInAction(() => {
        this.years = years;
        this.books = books;
        if (
          this.activeYearId === null ||
          !years.some((y) => y.id === this.activeYearId)
        ) {
          this.activeYearId = years[0]?.id ?? null;
        }
      });
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e.message : 'Не удалось загрузить план покупок';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createYear(year: number): Promise<void> {
    const created = await api.createPlanYear(year);
    runInAction(() => {
      this.years.push(created);
      this.years.sort((a, b) => a.year - b.year);
      this.activeYearId = created.id;
    });
  }

  async removeYear(id: number): Promise<void> {
    await api.deletePlanYear(id);
    runInAction(() => {
      this.years = this.years.filter((y) => y.id !== id);
      if (this.activeYearId === id) {
        this.activeYearId = this.years[0]?.id ?? null;
      }
    });
  }

  async addRow(yearId: number): Promise<number> {
    const row = await api.createPlanRow({ yearId, name: '' });
    runInAction(() => {
      const year = this.years.find((y) => y.id === yearId);
      if (year) year.rows.push(row);
    });
    return row.id;
  }

  async renameRow(id: number, name: string): Promise<void> {
    const row = await api.updatePlanRow(id, { name });
    runInAction(() => this.replaceRow(row));
  }

  async toggleRow(id: number, purchased: boolean): Promise<void> {
    const row = await api.updatePlanRow(id, { purchased });
    runInAction(() => this.replaceRow(row));
  }

  async linkRowBook(id: number, bookId: number | null): Promise<void> {
    const row = await api.updatePlanRow(id, { bookId });
    runInAction(() => this.replaceRow(row));
  }

  async removeRow(id: number): Promise<void> {
    await api.deletePlanRow(id);
    runInAction(() => {
      const year = this.years.find((y) => y.rows.some((r) => r.id === id));
      if (year) year.rows = year.rows.filter((r) => r.id !== id);
    });
  }

  async addSubrow(rowId: number): Promise<number> {
    const result = await api.createPlanSubrow({ rowId, name: '' });
    runInAction(() => this.applySubrowResult(result));
    return result.subrow?.id ?? -1;
  }

  async renameSubrow(id: number, name: string): Promise<void> {
    const result = await api.updatePlanSubrow(id, { name });
    runInAction(() => this.applySubrowResult(result));
  }

  async toggleSubrow(id: number, purchased: boolean): Promise<void> {
    const result = await api.updatePlanSubrow(id, { purchased });
    runInAction(() => this.applySubrowResult(result));
  }

  async linkSubrowBook(id: number, bookId: number | null): Promise<void> {
    const result = await api.updatePlanSubrow(id, { bookId });
    runInAction(() => this.applySubrowResult(result));
  }

  async removeSubrow(id: number): Promise<void> {
    const result = await api.deletePlanSubrow(id);
    runInAction(() => this.applySubrowResult(result));
  }

  private replaceRow(row: PlanRow): void {
    const year = this.years.find((y) => y.rows.some((r) => r.id === row.id));
    if (!year) return;
    const idx = year.rows.findIndex((r) => r.id === row.id);
    if (idx !== -1) year.rows[idx] = row;
  }

  private applySubrowResult(result: PlanSubrowMutationResult): void {
    this.replaceRow(result.row);
  }
}

export type { PlanRow, PlanSubrow };
