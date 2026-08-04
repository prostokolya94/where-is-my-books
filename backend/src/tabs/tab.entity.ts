import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface TabFilters {
  categories: number[];
  genres: number[];
  statuses: string[];
  search: string;
}

@Entity('tabs')
export class Tab {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', default: '{}' })
  filtersJson: string;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get filters(): TabFilters {
    try {
      const parsed = JSON.parse(this.filtersJson);
      return {
        categories: parsed.categories ?? [],
        genres: parsed.genres ?? [],
        statuses: parsed.statuses ?? [],
        search: parsed.search ?? '',
      };
    } catch {
      return { categories: [], genres: [], statuses: [], search: '' };
    }
  }
}
