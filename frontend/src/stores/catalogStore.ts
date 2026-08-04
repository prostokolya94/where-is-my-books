import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '../api/client';
import type { Category, Genre } from '../api/types';

export class CatalogStore {
  categories: Category[] = [];
  genres: Genre[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get genresByCategory(): Map<number | null, Genre[]> {
    const map = new Map<number | null, Genre[]>();
    for (const genre of this.genres) {
      const list = map.get(genre.categoryId) ?? [];
      list.push(genre);
      map.set(genre.categoryId, list);
    }
    return map;
  }

  get categoryById(): Map<number, Category> {
    return new Map(this.categories.map((c) => [c.id, c]));
  }

  get genreById(): Map<number, Genre> {
    return new Map(this.genres.map((g) => [g.id, g]));
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const [categories, genres] = await Promise.all([
        api.getCategories(),
        api.getGenres(),
      ]);
      runInAction(() => {
        this.categories = categories;
        this.genres = genres;
      });
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e.message : 'Не удалось загрузить справочники';
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async addCategory(name: string): Promise<Category> {
    const category = await api.createCategory({ name });
    runInAction(() => {
      this.categories.push(category);
      this.categories.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    });
    return category;
  }

  async renameCategory(id: number, name: string): Promise<void> {
    const updated = await api.updateCategory(id, { name });
    runInAction(() => {
      const idx = this.categories.findIndex((c) => c.id === id);
      if (idx !== -1) this.categories[idx] = updated;
    });
  }

  async removeCategory(id: number): Promise<void> {
    await api.deleteCategory(id);
    runInAction(() => {
      this.categories = this.categories.filter((c) => c.id !== id);
      this.genres = this.genres.filter((g) => g.categoryId !== id);
    });
  }

  async setCategoryOrder(ids: number[]): Promise<void> {
    const map = new Map(this.categories.map((c) => [c.id, c]));
    runInAction(() => {
      this.categories = ids.map((id) => map.get(id)).filter(Boolean) as Category[];
    });
    try {
      await api.reorderCategories(ids);
    } catch {
      this.load();
    }
  }

  async setGenreOrder(ids: number[]): Promise<void> {
    const ordered = new Set(ids);
    runInAction(() => {
      this.genres = [
        ...ids
          .map((id) => this.genres.find((g) => g.id === id))
          .filter(Boolean) as Genre[],
        ...this.genres.filter((g) => !ordered.has(g.id)),
      ];
    });
    try {
      await api.reorderGenres(ids);
    } catch {
      this.load();
    }
  }

  async addGenre(name: string, categoryId: number | null): Promise<Genre> {
    const genre = await api.createGenre({ name, categoryId });
    runInAction(() => {
      this.genres.push(genre);
      this.genres.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    });
    return genre;
  }

  async renameGenre(id: number, name: string, categoryId: number | null): Promise<void> {
    const updated = await api.updateGenre(id, { name, categoryId });
    runInAction(() => {
      const idx = this.genres.findIndex((g) => g.id === id);
      if (idx !== -1) this.genres[idx] = updated;
    });
  }

  async removeGenre(id: number): Promise<void> {
    await api.deleteGenre(id);
    runInAction(() => {
      this.genres = this.genres.filter((g) => g.id !== id);
    });
  }
}
