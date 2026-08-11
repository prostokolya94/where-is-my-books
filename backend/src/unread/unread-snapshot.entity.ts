import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('unread_monthly_snapshots')
@Index(['year', 'month'], { unique: true })
export class UnreadSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  year: number;

  @Column({ type: 'integer' })
  month: number;

  @Column({ type: 'integer', default: 0 })
  total: number;

  @CreateDateColumn()
  createdAt: Date;
}
