import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import type { DumpInfo } from '../api/types';

class DumpsStore {
  dumps: DumpInfo[] = [];
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
      const dumps = await api.getDumps();
      runInAction(() => {
        this.dumps = dumps;
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось загрузить список личных версий';
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
      const dumps = await api.createDump();
      runInAction(() => {
        this.dumps = dumps;
        this.notice = 'Личная версия создана.';
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось создать личную версию';
      });
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
  }

  async apply(id: number): Promise<void> {
    this.busy = true;
    this.error = null;
    this.notice = null;
    try {
      await api.applyDump(id);
      runInAction(() => {
        this.notice = 'Личная версия применена.';
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось применить личную версию';
      });
      return;
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
    await this.load();
  }

  async remove(id: number): Promise<void> {
    this.busy = true;
    this.error = null;
    this.notice = null;
    try {
      const dumps = await api.deleteDump(id);
      runInAction(() => {
        this.dumps = dumps;
        this.notice = 'Личная версия удалена.';
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось удалить личную версию';
      });
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
  }

  async download(id: number): Promise<void> {
    this.busy = true;
    this.error = null;
    try {
      const { data, fileName } = await api.downloadDump(id);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось скачать файл';
      });
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
  }

  async upload(file: File): Promise<void> {
    this.busy = true;
    this.error = null;
    this.notice = null;
    try {
      const dumps = await api.uploadDump(file);
      runInAction(() => {
        this.dumps = dumps;
        this.notice = 'Файл загружен.';
      });
    } catch (e) {
      runInAction(() => {
        this.error =
          e instanceof Error ? e.message : 'Не удалось загрузить файл';
      });
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
  }
}

export const dumpsStore = new DumpsStore();