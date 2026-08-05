import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PurchasePlanYear } from './purchase-plan-year.entity';
import { PurchasePlanSubrow } from './purchase-plan-subrow.entity';
import { Book } from '../books/book.entity';

@Entity('purchase_plan_rows')
export class PurchasePlanRow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  yearId: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: false })
  purchased: boolean;

  @Column({ type: 'integer', nullable: true })
  bookId: number | null;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PurchasePlanYear, (year) => year.rows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'yearId' })
  year: PurchasePlanYear;

  @ManyToOne(() => Book, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bookId' })
  book: Book | null;

  @OneToMany(() => PurchasePlanSubrow, (subrow) => subrow.row, {
    onDelete: 'CASCADE',
  })
  subrows: PurchasePlanSubrow[];
}
