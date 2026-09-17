import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { PurchasePlanRow } from './purchase-plan-row.entity';

@Entity('purchase_plan_years')
@Unique(['userId', 'year'])
export class PurchasePlanYear {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  userId: number;

  @Column({ type: 'integer' })
  year: number;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PurchasePlanRow, (row) => row.year, { onDelete: 'CASCADE' })
  rows: PurchasePlanRow[];
}
