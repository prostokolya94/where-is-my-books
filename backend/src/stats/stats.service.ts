import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { BookStatus } from '../common/book-status.enum';

export interface StatsCategoryColumn {
  id: number | null;
  name: string;
  total: number;
}

export interface StatsGenreRow {
  genreId: number | null;
  genreName: string;
  genreCategoryId: number | null;
  total: number;
  byCategory: Record<string, number>;
}

export interface StatsResponse {
  columns: StatsCategoryColumn[];
  rows: StatsGenreRow[];
  total: number;
  status: BookStatus | null;
  statusTotals: Record<BookStatus, number>;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async getStats(status?: string): Promise<StatsResponse> {
    let statusFilter: BookStatus | null = null;
    if (status && (Object.values(BookStatus) as string[]).includes(status)) {
      statusFilter = status as BookStatus;
    }

    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category')
      .leftJoinAndSelect('book.genre', 'genre');

    const allBooks = await this.bookRepo.find();

    const statusTotals: Record<BookStatus, number> = {
      [BookStatus.READ]: 0,
      [BookStatus.BOUGHT]: 0,
      [BookStatus.WISHLIST]: 0,
      [BookStatus.ABANDONED]: 0,
    };
    for (const book of allBooks) {
      statusTotals[book.status] += 1;
    }

    if (statusFilter) {
      qb.where('book.status = :status', { status: statusFilter });
    }

    const books = await qb.getMany();

    const categoryNames = new Map<number, string>();
    const genreNames = new Map<number, string>();
    const genreCategories = new Map<number, number | null>();
    const categoryIds = new Set<number>();

    for (const book of books) {
      if (book.category) {
        categoryNames.set(book.category.id, book.category.name);
        categoryIds.add(book.category.id);
      }
      if (book.genre) {
        genreNames.set(book.genre.id, book.genre.name);
        genreCategories.set(book.genre.id, book.genre.categoryId);
      }
    }

    const columns: StatsCategoryColumn[] = Array.from(categoryIds)
      .sort((a, b) => a - b)
      .map((id) => ({
        id,
        name: categoryNames.get(id) ?? 'Без категории',
        total: 0,
      }));
    columns.push({ id: null, name: 'Без категории', total: 0 });

    const rowsMap = new Map<number, StatsGenreRow>();

    for (const book of books) {
      const colId = book.categoryId ?? null;
      const col = columns.find((c) => c.id === colId);
      if (col) col.total += 1;

      const rowKey = book.genreId ?? 0;
      let row = rowsMap.get(rowKey);
      if (!row) {
        row = {
          genreId: book.genreId,
          genreName: book.genre ? book.genre.name : 'Без жанра',
          genreCategoryId: book.genre ? book.genre.categoryId : null,
          total: 0,
          byCategory: {},
        };
        rowsMap.set(rowKey, row);
      }
      row.total += 1;
      const key = String(colId ?? '');
      row.byCategory[key] = (row.byCategory[key] ?? 0) + 1;
    }

    const rows = Array.from(rowsMap.values()).sort((a, b) =>
      a.genreName.localeCompare(b.genreName, 'ru'),
    );

    return {
      columns,
      rows,
      total: books.length,
      status: statusFilter,
      statusTotals,
    };
  }
}
