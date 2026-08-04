import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import type { BookStatus, StatsResponse } from '../api/types';

export class StatsStore {
  stats: StatsResponse | null = null;
  status: BookStatus | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setStatus(status: BookStatus | null): void {
    this.status = status;
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const stats = await api.getStats(this.status ?? undefined);
      runInAction(() => {
        this.stats = stats;
      });
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e.message : 'Не удалось загрузить статистику';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
}
