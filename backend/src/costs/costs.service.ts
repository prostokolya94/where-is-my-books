import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { BookStatus } from '../common/book-status.enum';
import { CostAccount, CostAccountFilters } from './cost-account.entity';
import { CreateCostAccountDto, UpdateCostAccountDto } from './dto/cost.dto';

const VALID_COST_STATUSES = [BookStatus.READ, BookStatus.BOUGHT];

export interface CostResult {
  sum: number;
  count: number;
}

export interface CostSummary {
  total: number;
  read: number;
  unread: number;
  counts: { total: number; read: number; unread: number };
  accounts: CostAccountView[];
  generatedAt: string;
}

export interface CostAccountView {
  id: number;
  name: string;
  sortOrder: number;
  filters: CostAccountFilters;
  result: CostResult;
}

@Injectable()
export class CostsService {
  constructor(
    @InjectRepository(CostAccount)
    private readonly accountRepo: Repository<CostAccount>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async getSummary(): Promise<CostSummary> {
    const allBooks = await this.bookRepo.find();
    const costBooks = allBooks.filter((b) => b.status !== BookStatus.WISHLIST);
    const readBooks = costBooks.filter((b) => b.status === BookStatus.READ);
    const boughtBooks = costBooks.filter((b) => b.status === BookStatus.BOUGHT);

    const accounts = await this.accountRepo.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return {
      total: this.sumPrices(costBooks),
      read: this.sumPrices(readBooks),
      unread: this.sumPrices(boughtBooks),
      counts: {
        total: costBooks.length,
        read: readBooks.length,
        unread: boughtBooks.length,
      },
      accounts: accounts.map((account) => this.serialize(account, allBooks)),
      generatedAt: new Date().toISOString(),
    };
  }

  async findAll(): Promise<CostAccountView[]> {
    const allBooks = await this.bookRepo.find();
    const accounts = await this.accountRepo.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return accounts.map((account) => this.serialize(account, allBooks));
  }

  async create(dto: CreateCostAccountDto): Promise<CostAccountView> {
    const maxSort = await this.accountRepo
      .createQueryBuilder('account')
      .select('MAX(account.sortOrder)', 'max')
      .getRawOne<{ max: number | null }>();
    const account = this.accountRepo.create({
      name: dto.name,
      filtersJson: CostsService.toFiltersJson(dto),
      sortOrder: dto.sortOrder ?? (maxSort?.max ?? -1) + 1,
    });
    const saved = await this.accountRepo.save(account);
    const allBooks = await this.bookRepo.find();
    return this.serialize(saved, allBooks);
  }

  async update(id: number, dto: UpdateCostAccountDto): Promise<CostAccountView> {
    const account = await this.accountRepo.findOneBy({ id });
    if (!account) throw new NotFoundException('Счёт не найден');
    if (dto.name !== undefined) account.name = dto.name;
    if (dto.sortOrder !== undefined) account.sortOrder = dto.sortOrder;
    const current = account.filters;
    account.filtersJson = JSON.stringify({
      categories: dto.categories ?? current.categories,
      genres: dto.genres ?? current.genres,
      statuses: dto.statuses ?? current.statuses,
      purchaseYearFrom:
        dto.purchaseYearFrom !== undefined ? dto.purchaseYearFrom : current.purchaseYearFrom,
      purchaseYearTo:
        dto.purchaseYearTo !== undefined ? dto.purchaseYearTo : current.purchaseYearTo,
    });
    const saved = await this.accountRepo.save(account);
    const allBooks = await this.bookRepo.find();
    return this.serialize(saved, allBooks);
  }

  async remove(id: number): Promise<void> {
    const account = await this.accountRepo.findOneBy({ id });
    if (!account) throw new NotFoundException('Счёт не найден');
    await this.accountRepo.delete(id);
  }

  private serialize(account: CostAccount, allBooks: Book[]): CostAccountView {
    const matched = allBooks.filter((book) => CostsService.matches(book, account.filters));
    return {
      id: account.id,
      name: account.name,
      sortOrder: account.sortOrder,
      filters: account.filters,
      result: CostsService.calcResult(matched),
    };
  }

  private static toFiltersJson(
    dto: CreateCostAccountDto | UpdateCostAccountDto,
  ): string {
    return JSON.stringify({
      categories: dto.categories ?? [],
      genres: dto.genres ?? [],
      statuses: dto.statuses ?? [],
      purchaseYearFrom: dto.purchaseYearFrom ?? null,
      purchaseYearTo: dto.purchaseYearTo ?? null,
    });
  }

  private static matches(book: Book, filters: CostAccountFilters): boolean {
    const statuses: BookStatus[] =
      filters.statuses.length > 0 ? filters.statuses : VALID_COST_STATUSES;
    if (!statuses.includes(book.status)) return false;

    if (filters.purchaseYearFrom != null) {
      if (book.purchaseYear == null || book.purchaseYear < filters.purchaseYearFrom) {
        return false;
      }
    }
    if (filters.purchaseYearTo != null) {
      if (book.purchaseYear == null || book.purchaseYear > filters.purchaseYearTo) {
        return false;
      }
    }

    const categories = filters.categories ?? [];
    const genres = filters.genres ?? [];
    if (categories.length > 0 || genres.length > 0) {
      const inCategory =
        book.categoryId != null && categories.includes(book.categoryId);
      const inGenre = book.genreId != null && genres.includes(book.genreId);
      if (!inCategory && !inGenre) return false;
    }

    return true;
  }

  private static calcResult(books: Book[]): CostResult {
    let sum = 0;
    for (const book of books) {
      if (book.price != null) sum += book.price;
    }
    return { sum, count: books.length };
  }

  private sumPrices(books: Book[]): number {
    return books.reduce((s, book) => s + (book.price ?? 0), 0);
  }
}