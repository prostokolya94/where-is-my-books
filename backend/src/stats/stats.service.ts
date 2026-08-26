import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { BookStatus } from '../common/book-status.enum';
import { Category } from '../categories/category.entity';

export interface StatsGenreCount {
  genreId: number | null;
  genreName: string;
  count: number;
}

export interface StatsCategoryTable {
  categoryId: number | null;
  categoryName: string;
  genres: StatsGenreCount[];
  total: number;
}

export interface StatsResponse {
  tables: StatsCategoryTable[];
  total: number;
  statusTotals: Record<BookStatus, number>;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async getStats(): Promise<StatsResponse> {
    const statusTotals: Record<BookStatus, number> = {
      [BookStatus.READ]: 0,
      [BookStatus.BOUGHT]: 0,
      [BookStatus.WISHLIST]: 0,
    };
    const allBooks = await this.bookRepo.find();
    for (const book of allBooks) {
      statusTotals[book.status] += 1;
    }

    const categories = await this.categoryRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    const categoryNames = new Map<number, string>();
    const orderIndex = new Map<number, number>();
    categories.forEach((c, index) => {
      categoryNames.set(c.id, c.name);
      orderIndex.set(c.id, index);
    });

    const books = await this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category')
      .leftJoinAndSelect('book.genre', 'genre')
      .where('book.status != :wishlist', { wishlist: BookStatus.WISHLIST })
      .getMany();

    const tables = new Map<number | null, StatsCategoryTable>();
    const genreAggs = new Map<number | null, Map<number, StatsGenreCount>>();

    for (const book of books) {
      const tableKey = book.genre ? book.genre.categoryId : book.categoryId;
      const genreId = book.genreId ?? 0;
      const genreName = book.genre ? book.genre.name : 'Без жанра';

      let table = tables.get(tableKey);
      let aggs = genreAggs.get(tableKey);
      if (!table) {
        table = {
          categoryId: tableKey,
          categoryName: categoryNames.get(tableKey) ?? 'Без категории',
          genres: [],
          total: 0,
        };
        tables.set(tableKey, table);
        aggs = new Map();
        genreAggs.set(tableKey, aggs);
      }
      table.total += 1;

      let genre = aggs.get(genreId);
      if (!genre) {
        genre = { genreId: book.genreId, genreName, count: 0 };
        aggs.set(genreId, genre);
      }
      genre.count += 1;
    }

    const orderedTables = Array.from(tables.entries())
      .sort(([a], [b]) => {
        const ai =
          a === null ? Number.MAX_SAFE_INTEGER : orderIndex.get(a) ?? categories.length + a;
        const bi =
          b === null ? Number.MAX_SAFE_INTEGER : orderIndex.get(b) ?? categories.length + b;
        return ai - bi;
      })
      .map(([key, table]) => {
        table.genres = Array.from(genreAggs.get(key)?.values() ?? []).sort((x, y) =>
          x.genreName.localeCompare(y.genreName, 'ru'),
        );
        return table;
      });

    return {
      tables: orderedTables,
      total: books.length,
      statusTotals,
    };
  }
}