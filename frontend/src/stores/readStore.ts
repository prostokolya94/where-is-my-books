import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import type { ReadOverview } from '../api/types';

export class ReadStore {
  overview: ReadOverview | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const overview = await api.getReadOverview();
      runInAction(() => {
        this.overview = overview;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось загрузить мониторинг прочитанного';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
}
