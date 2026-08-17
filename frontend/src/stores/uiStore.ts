import { makeAutoObservable } from 'mobx';
import type { Tab } from '../api/types';

class UIStore {
  tabEditorOpen = false;
  tabEditorTarget: Tab | null = null;
  backupsOpen = false;

  constructor() {
    makeAutoObservable(this);
  }

  openNewTab(): void {
    this.tabEditorTarget = null;
    this.tabEditorOpen = true;
  }

  openTabEditor(tab: Tab): void {
    this.tabEditorTarget = tab;
    this.tabEditorOpen = true;
  }

  closeTabEditor(): void {
    this.tabEditorOpen = false;
    this.tabEditorTarget = null;
  }

  openBackups(): void {
    this.backupsOpen = true;
  }

  closeBackups(): void {
    this.backupsOpen = false;
  }
}

export const uiStore = new UIStore();
