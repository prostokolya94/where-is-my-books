import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BookStatus } from '../common/book-status.enum';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/genre.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: '' })
  author: string;

  @Column({ type: 'integer', nullable: true })
  purchaseYear: number | null;

  @Column({ type: 'varchar', default: BookStatus.WISHLIST })
  status: BookStatus;

  @Column({ type: 'integer', nullable: true })
  categoryId: number | null;

  @Column({ type: 'integer', nullable: true })
  genreId: number | null;

  @Column({ type: 'real', nullable: true })
  price: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @ManyToOne(() => Genre, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'genreId' })
  genre: Genre | null;
}
