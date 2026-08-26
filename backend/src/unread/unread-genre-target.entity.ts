import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('unread_genre_targets')
export class UnreadGenreTarget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', unique: true })
  genreId: number;

  @Column({ type: 'integer', default: 0 })
  target: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
