import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchasePlanRow } from './purchase-plan-row.entity';
import { Book } from '../books/book.entity';

@Entity('purchase_plan_subrows')
export class PurchasePlanSubrow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  rowId: number;

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

  @ManyToOne(() => PurchasePlanRow, (row) => row.subrows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rowId' })
  row: PurchasePlanRow;

  @ManyToOne(() => Book, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bookId' })
  book: Book | null;
}
