import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import type { UnreadOverview } from '../api/types';

export class UnreadStore {
  overview: UnreadOverview | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const overview = await api.getUnreadOverview();
      runInAction(() => {
        this.overview = overview;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось загрузить мониторинг непрочитанного';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async setGenreTarget(genreId: number, target: number | null): Promise<void> {
    await api.setUnreadGenreTarget(genreId, target);
    runInAction(() => {
      const g = this.overview?.genres.find((g) => g.genreId === genreId);
      if (g) g.target = target;
    });
  }
}
