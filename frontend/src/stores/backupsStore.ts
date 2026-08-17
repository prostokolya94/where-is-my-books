import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import type { BackupInfo } from '../api/types';

export class BackupsStore {
  backups: BackupInfo[] = [];
  loading = false;
  busy = false;
  error: string | null = null;
  notice: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const backups = await api.getBackups();
      runInAction(() => {
        this.backups = backups;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось загрузить список копий';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async create(): Promise<void> {
    this.busy = true;
    this.error = null;
    this.notice = null;
    try {
      const result = await api.createBackup();
      runInAction(() => {
        this.backups = result.backups;
        this.notice = result.deleted
          ? `Копия создана. Самая старая копия «${result.deleted}» удалена.`
          : 'Резервная копия создана.';
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось создать резервную копию';
      });
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
  }

  async remove(name: string): Promise<void> {
    this.busy = true;
    this.error = null;
    this.notice = null;
    try {
      const backups = await api.deleteBackup(name);
      runInAction(() => {
        this.backups = backups;
        this.notice = `Копия «${name}» удалена.`;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось удалить копию';
      });
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
  }

  async apply(name: string): Promise<void> {
    this.busy = true;
    this.error = null;
    this.notice = null;
    try {
      await api.applyBackup(name);
      runInAction(() => {
        this.notice = `Копия «${name}» применена.`;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось применить копию';
      });
      return;
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
    await this.load();
  }
}

export const backupsStore = new BackupsStore();