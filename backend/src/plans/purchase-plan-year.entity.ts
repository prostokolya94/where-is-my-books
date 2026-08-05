import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PurchasePlanRow } from './purchase-plan-row.entity';

@Entity('purchase_plan_years')
export class PurchasePlanYear {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', unique: true })
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
