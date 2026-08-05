import { BookStore } from './bookStore';
import { CatalogStore } from './catalogStore';
import { TabStore } from './tabStore';
import { StatsStore } from './statsStore';
import { PlanStore } from './planStore';

class RootStore {
  catalog: CatalogStore;
  books: BookStore;
  tabs: TabStore;
  stats: StatsStore;
  plans: PlanStore;

  constructor() {
    this.catalog = new CatalogStore();
    this.books = new BookStore();
    this.tabs = new TabStore();
    this.stats = new StatsStore();
    this.plans = new PlanStore();
  }

  async init(): Promise<void> {
    await Promise.all([this.catalog.load(), this.tabs.load()]);
  }
}

export const rootStore = new RootStore();
