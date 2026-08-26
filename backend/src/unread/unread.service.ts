import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { BookStatus } from '../common/book-status.enum';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/genre.entity';
import { UnreadSnapshot } from './unread-snapshot.entity';
import { UnreadGenreTarget } from './unread-genre-target.entity';

const UNREAD_STATUS = BookStatus.BOUGHT;

export interface UnreadSeriesPoint {
  year: number;
  month: number;
  total: number;
  isCurrent: boolean;
}

export interface UnreadCategoryInfo {
  categoryId: number | null;
  name: string;
  count: number;
}

export interface UnreadGenreInfo {
  genreId: number | null;
  name: string;
  categoryId: number | null;
  categoryName: string;
  count: number;
  target: number | null;
}

export interface UnreadYearInfo {
  year: number | null;
  count: number;
}

export interface UnreadOverview {
  series: UnreadSeriesPoint[];
  total: { current: number; previousMonth: number | null };
  categories: UnreadCategoryInfo[];
  genres: UnreadGenreInfo[];
  yearBreakdown: UnreadYearInfo[];
  generatedAt: string;
}

@Injectable()
export class UnreadService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    @InjectRepository(UnreadSnapshot)
    private readonly snapshotRepo: Repository<UnreadSnapshot>,
    @InjectRepository(UnreadGenreTarget)
    private readonly targetRepo: Repository<UnreadGenreTarget>,
  ) {}

  async getOverview(): Promise<UnreadOverview> {
    await this.ensurePreviousMonthFrozen();

    const allBooks = await this.bookRepo.find();
    const unreadBooks = allBooks.filter((b) => b.status === UNREAD_STATUS);

    const categories = await this.categoryRepo.find({
      order: { name: 'ASC' },
    });
    const genres = await this.genreRepo.find({
      order: { name: 'ASC' },
      relations: { category: true },
    });
    const targets = await this.targetRepo.find();

    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

    const catCounts = new Map<number | null, number>();
    const genreCounts = new Map<number | null, number>();
    const noGenreByCategory = new Map<number | null, number>();

    for (const book of unreadBooks) {
      const cat = book.categoryId ?? null;
      catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
      if (book.genreId != null) {
        genreCounts.set(book.genreId, (genreCounts.get(book.genreId) ?? 0) + 1);
      } else {
        noGenreByCategory.set(cat, (noGenreByCategory.get(cat) ?? 0) + 1);
      }
    }

    const categoriesInfo: UnreadCategoryInfo[] = [
      {
        categoryId: null,
        name: 'Без категории',
        count: catCounts.get(null) ?? 0,
      },
      ...categories.map((c) => ({
        categoryId: c.id,
        name: c.name,
        count: catCounts.get(c.id) ?? 0,
      })),
    ];

    const targetMap = new Map(targets.map((t) => [t.genreId, t.target]));

    const genresInfo: UnreadGenreInfo[] = [];
    for (const g of genres) {
      const count = genreCounts.get(g.id) ?? 0;
      if (count === 0) continue;
      genresInfo.push({
        genreId: g.id,
        name: g.name,
        categoryId: g.categoryId,
        categoryName:
          g.categoryId != null
            ? (g.category?.name ?? 'Без категории')
            : 'Без категории',
        count,
        target: targetMap.get(g.id) ?? null,
      });
    }
    for (const [cat, count] of noGenreByCategory) {
      genresInfo.push({
        genreId: null,
        name: 'Без жанра',
        categoryId: cat,
        categoryName:
          cat != null ? (categoryNames.get(cat) ?? 'Без категории') : 'Без категории',
        count,
        target: null,
      });
    }
    genresInfo.sort(
      (a, b) =>
        a.categoryName.localeCompare(b.categoryName, 'ru') ||
        a.name.localeCompare(b.name, 'ru'),
    );

    const yearCounts = new Map<number | null, number>();
    for (const book of unreadBooks) {
      const y = book.purchaseYear ?? null;
      yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
    }
    const yearBreakdown: UnreadYearInfo[] = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => {
        if (a.year === null) return 1;
        if (b.year === null) return -1;
        return a.year - b.year;
      });

    const snapshots = await this.snapshotRepo.find({
      order: { year: 'ASC', month: 'ASC' },
    });
    const series: UnreadSeriesPoint[] = snapshots.map((s) => ({
      year: s.year,
      month: s.month,
      total: s.total,
      isCurrent: false,
    }));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    series.push({
      year: currentYear,
      month: currentMonth,
      total: unreadBooks.length,
      isCurrent: true,
    });

    const prev = this.previousMonth(currentYear, currentMonth);
    const prevSnapshot = snapshots.find(
      (s) => s.year === prev.year && s.month === prev.month,
    );

    return {
      series,
      total: {
        current: unreadBooks.length,
        previousMonth: prevSnapshot?.total ?? null,
      },
      categories: categoriesInfo,
      genres: genresInfo,
      yearBreakdown,
      generatedAt: now.toISOString(),
    };
  }

  async setGenreTarget(genreId: number, target: number | null): Promise<void> {
    const genre = await this.genreRepo.findOneBy({ id: genreId });
    if (!genre) {
      throw new NotFoundException('Жанр не найден');
    }
    const existing = await this.targetRepo.findOneBy({ genreId });
    if (target == null) {
      if (existing) {
        await this.targetRepo.delete(existing.id);
      }
      return;
    }
    if (existing) {
      existing.target = target;
      await this.targetRepo.save(existing);
    } else {
      await this.targetRepo.save(
        this.targetRepo.create({ genreId, target }),
      );
    }
  }

  private async ensurePreviousMonthFrozen(): Promise<void> {
    const now = new Date();
    const prev = this.previousMonth(now.getFullYear(), now.getMonth() + 1);
    const existing = await this.snapshotRepo.findOneBy({
      year: prev.year,
      month: prev.month,
    });
    if (existing) return;
    const allBooks = await this.bookRepo.find();
    const total = allBooks.filter((b) => b.status === UNREAD_STATUS).length;
    await this.snapshotRepo.save(
      this.snapshotRepo.create({
        year: prev.year,
        month: prev.month,
        total,
      }),
    );
  }

  private previousMonth(year: number, month: number): { year: number; month: number } {
    if (month === 1) return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
  }
}
