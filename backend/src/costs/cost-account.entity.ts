import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BookStatus } from '../common/book-status.enum';

export interface CostAccountFilters {
  categories: number[];
  genres: number[];
  statuses: BookStatus[];
  purchaseYearFrom: number | null;
  purchaseYearTo: number | null;
}

@Entity('cost_accounts')
export class CostAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  userId: number;

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

  get filters(): CostAccountFilters {
    try {
      const parsed = JSON.parse(this.filtersJson);
      return {
        categories: parsed.categories ?? [],
        genres: parsed.genres ?? [],
        statuses: parsed.statuses ?? [],
        purchaseYearFrom: parsed.purchaseYearFrom ?? null,
        purchaseYearTo: parsed.purchaseYearTo ?? null,
      };
    } catch {
      return {
        categories: [],
        genres: [],
        statuses: [],
        purchaseYearFrom: null,
        purchaseYearTo: null,
      };
    }
  }
}