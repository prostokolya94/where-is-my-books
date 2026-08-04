import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import { EMPTY_TAB_FILTERS, type Tab } from '../api/types';

export class TabStore {
  tabs: Tab[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const tabs = await api.getTabs();
      runInAction(() => {
        this.tabs = tabs;
      });
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e.message : 'Не удалось загрузить табы';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async create(name: string): Promise<Tab> {
    const tab = await api.createTab({ name, filters: { ...EMPTY_TAB_FILTERS } });
    runInAction(() => {
      this.tabs.push(tab);
    });
    return tab;
  }

  async update(id: number, data: { name?: string; filters?: Tab['filters'] }): Promise<void> {
    const updated = await api.updateTab(id, data);
    runInAction(() => {
      const idx = this.tabs.findIndex((t) => t.id === id);
      if (idx !== -1) this.tabs[idx] = updated;
    });
  }

  async remove(id: number): Promise<void> {
    await api.deleteTab(id);
    runInAction(() => {
      this.tabs = this.tabs.filter((t) => t.id !== id);
    });
  }
}
