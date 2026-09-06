import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import type { CostAccountFilters, CostSummary } from '../api/types';

export class CostStore {
  summary: CostSummary | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const summary = await api.getCostSummary();
      runInAction(() => {
        this.summary = summary;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось загрузить стоимость библиотеки';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async create(account: { name: string } & CostAccountFilters): Promise<void> {
    this.saving = true;
    this.error = null;
    try {
      await api.createCostAccount(account);
      await this.load();
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось создать счёт';
      });
      throw e;
    } finally {
      runInAction(() => {
        this.saving = false;
      });
    }
  }

  async update(id: number, account: { name: string } & CostAccountFilters): Promise<void> {
    this.saving = true;
    this.error = null;
    try {
      await api.updateCostAccount(id, account);
      await this.load();
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось обновить счёт';
      });
      throw e;
    } finally {
      runInAction(() => {
        this.saving = false;
      });
    }
  }

  async remove(id: number): Promise<void> {
    await api.deleteCostAccount(id);
    await this.load();
  }
}