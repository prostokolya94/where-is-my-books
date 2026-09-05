import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { BookStatus } from '../common/book-status.enum';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/genre.entity';

const READ_STATUS = BookStatus.READ;

export interface ReadBar {
  categoryId: number | null;
  name: string;
  count: number;
}

export interface GenreBar {
  genreId: number | null;
  name: string;
  count: number;
}

export interface ReadPeriodCharts {
  all: ReadBar[];
  year: ReadBar[];
  month: ReadBar[];
}

export interface ReadCategoryBlock {
  categoryId: number | null;
  name: string;
  periods: {
    all: GenreBar[];
    year: GenreBar[];
    month: GenreBar[];
  };
}

export interface ReadOverview {
  total: { current: number; previousMonth: number | null };
  categories: ReadPeriodCharts;
  byCategory: ReadCategoryBlock[];
  generatedAt: string;
}

interface Readable {
  status: BookStatus;
  categoryId: number | null;
  genreId: number | null;
  readYear: number | null;
  readMonth: number | null;
}

function inPeriod(book: Readable, year: number, month: number): boolean {
  return book.readYear === year && book.readMonth === month;
}

@Injectable()
export class ReadService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
  ) {}

  async getOverview(): Promise<ReadOverview> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prev = this.previousMonth(currentYear, currentMonth);

    const allBooks = await this.bookRepo.find();
    const readBooks = allBooks.filter((b) => b.status === READ_STATUS);

    const categories = await this.categoryRepo.find({
      order: { name: 'ASC' },
    });
    const genres = await this.genreRepo.find({
      order: { name: 'ASC' },
      relations: { category: true },
    });

    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

    const countCategory = (books: Readable[]) => {
      const map = new Map<number | null, number>();
      for (const b of books) {
        map.set(b.categoryId ?? null, (map.get(b.categoryId ?? null) ?? 0) + 1);
      }
      return map;
    };

    const countGenreForCategory = (books: Readable[], categoryId: number | null) => {
      const map = new Map<number | null, number>();
      for (const b of books) {
        if ((b.categoryId ?? null) !== categoryId) continue;
        if (b.genreId != null) {
          map.set(b.genreId, (map.get(b.genreId) ?? 0) + 1);
        } else {
          map.set(null, (map.get(null) ?? 0) + 1);
        }
      }
      return map;
    };

    const genreNames = new Map(genres.map((g) => [g.id, g.name]));

    const buildCategoryBars = (
      catCounts: Map<number | null, number>,
    ): ReadBar[] => {
      const rows: ReadBar[] = [];
      const pushSingle = (categoryId: number | null) => {
        rows.push({
          categoryId,
          name: categoryId === null ? 'Без категории' : categoryNames.get(categoryId) ?? 'Без категории',
          count: catCounts.get(categoryId) ?? 0,
        });
      };
      pushSingle(null);
      for (const category of categories) pushSingle(category.id);
      return rows;
    };

    const allCat = countCategory(readBooks);
    const yearCat = countCategory(
      readBooks.filter((b) => b.readYear === currentYear),
    );
    const monthCat = countCategory(
      readBooks.filter((b) => inPeriod(b, currentYear, currentMonth)),
    );

    const categoryIdsInUse = new Set<number | null>();
    readBooks.forEach((b) => categoryIdsInUse.add(b.categoryId ?? null));

    const byCategory: ReadCategoryBlock[] = [];
    const buildGenreBars = (
      genreCounts: Map<number | null, number>,
    ): GenreBar[] => {
      const rows: GenreBar[] = [];
      for (const [genreId, count] of genreCounts) {
        if (genreId === null) {
          rows.push({ genreId: null, name: 'Без жанра', count });
        } else {
          rows.push({ genreId, name: genreNames.get(genreId) ?? 'Жанр', count });
        }
      }
      return rows.sort((a, b) => b.count - a.count);
    };

    for (const category of categories) {
      if (!categoryIdsInUse.has(category.id)) continue;
      const catBooks = readBooks.filter((b) => (b.categoryId ?? null) === category.id);
      byCategory.push({
        categoryId: category.id,
        name: category.name,
        periods: {
          all: buildGenreBars(countGenreForCategory(catBooks, category.id)),
          year: buildGenreBars(
            countGenreForCategory(
              catBooks.filter((b) => b.readYear === currentYear),
              category.id,
            ),
          ),
          month: buildGenreBars(
            countGenreForCategory(
              catBooks.filter((b) => inPeriod(b, currentYear, currentMonth)),
              category.id,
            ),
          ),
        },
      });
    }

    const noCategoryBooks = readBooks.filter((b) => b.categoryId == null);
    if (noCategoryBooks.length > 0) {
      byCategory.push({
        categoryId: null,
        name: 'Без категории',
        periods: {
          all: buildGenreBars(countGenreForCategory(noCategoryBooks, null)),
          year: buildGenreBars(
            countGenreForCategory(
              noCategoryBooks.filter((b) => b.readYear === currentYear),
              null,
            ),
          ),
          month: buildGenreBars(
            countGenreForCategory(
              noCategoryBooks.filter((b) => inPeriod(b, currentYear, currentMonth)),
              null,
            ),
          ),
        },
      });
    }

    const currentMonthCount = monthOf(readBooks, currentYear, currentMonth);
    const prevCount = readBooks.filter((b) =>
      inPeriod(b, prev.year, prev.month),
    ).length;

    return {
      total: {
        current: currentMonthCount,
        previousMonth: prevCount,
      },
      categories: {
        all: buildCategoryBars(allCat),
        year: buildCategoryBars(yearCat),
        month: buildCategoryBars(monthCat),
      },
      byCategory,
      generatedAt: now.toISOString(),
    };
  }

  private previousMonth(year: number, month: number): { year: number; month: number } {
    if (month === 1) return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
  }
}

function monthOf(books: Readable[], year: number, month: number): number {
  return books.filter((b) => inPeriod(b, year, month)).length;
}
