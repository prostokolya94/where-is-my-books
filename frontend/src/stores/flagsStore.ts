import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import type { AppFlag } from '../api/types';

const FALLBACK_PRIORITY: Array<[string, string]> = [
  ['page.books', '/'],
  ['page.stats', '/stats'],
  ['page.plans', '/plans'],
  ['page.unread', '/unread'],
  ['page.read', '/read'],
  ['page.costs', '/costs'],
  ['page.categories', '/categories'],
];

class FlagsStore {
  flags: AppFlag[] = [];
  loaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  init(): void {
    api
      .getFlags()
      .then((list) => {
        runInAction(() => {
          this.flags = list;
          this.loaded = true;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.loaded = true;
        });
      });
  }

  isEnabled(name: string): boolean {
    const flag = this.flags.find((item) => item.name === name);
    return flag ? flag.enabled : true;
  }

  fallbackPath(): string {
    for (const [name, path] of FALLBACK_PRIORITY) {
      if (this.isEnabled(name)) return path;
    }
    return '/locked';
  }

  async set(name: string, enabled: boolean): Promise<void> {
    const updated = await api.updateFlag(name, enabled);
    runInAction(() => {
      this.flags = this.flags.map((item) =>
        item.name === updated.name ? updated : item,
      );
    });
  }
}

export const flagsStore = new FlagsStore();