import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchasePlanYear } from './purchase-plan-year.entity';
import { PurchasePlanRow } from './purchase-plan-row.entity';
import { PurchasePlanSubrow } from './purchase-plan-subrow.entity';
import { Book } from '../books/book.entity';
import { BookStatus } from '../common/book-status.enum';
import {
  CreatePlanYearDto,
  CreatePlanRowDto,
  UpdatePlanRowDto,
  CreatePlanSubrowDto,
  UpdatePlanSubrowDto,
} from './dto/plan.dto';

export interface PlanBookRef {
  id: number;
  title: string;
}

export interface PlanSubrowResponse {
  id: number;
  rowId: number;
  name: string;
  purchased: boolean;
  bookId: number | null;
  book: PlanBookRef | null;
  sortOrder: number;
}

export interface PlanRowResponse {
  id: number;
  yearId: number;
  name: string;
  purchased: boolean;
  bookId: number | null;
  book: PlanBookRef | null;
  sortOrder: number;
  subrows: PlanSubrowResponse[];
}

export interface PlanYearResponse {
  id: number;
  year: number;
  sortOrder: number;
  rows: PlanRowResponse[];
}

export interface PlanSubrowMutationResult {
  row: PlanRowResponse;
  subrow?: PlanSubrowResponse;
}

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(PurchasePlanYear)
    private readonly yearsRepo: Repository<PurchasePlanYear>,
    @InjectRepository(PurchasePlanRow)
    private readonly rowsRepo: Repository<PurchasePlanRow>,
    @InjectRepository(PurchasePlanSubrow)
    private readonly subrowsRepo: Repository<PurchasePlanSubrow>,
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
  ) {}

  async ensureDefaultYear(userId: number): Promise<void> {
    const count = await this.yearsRepo.countBy({ userId });
    if (count === 0) {
      await this.yearsRepo.save(
        this.yearsRepo.create({
          userId,
          year: new Date().getFullYear(),
          sortOrder: 0,
        }),
      );
    }
  }

  async findAll(userId: number): Promise<PlanYearResponse[]> {
    await this.ensureDefaultYear(userId);
    const years = await this.yearsRepo.find({
      where: { userId },
      order: { year: 'ASC' },
      relations: { rows: { subrows: { book: true }, book: true } },
    });
    return years.map((year) => this.serializeYear(year));
  }

  async createYear(dto: CreatePlanYearDto, userId: number): Promise<PlanYearResponse> {
    const existing = await this.yearsRepo.findOneBy({ year: dto.year, userId });
    if (existing) {
      throw new ConflictException('Этот год уже есть в плане покупок');
    }
    const saved = await this.yearsRepo.save(
      this.yearsRepo.create({ year: dto.year, sortOrder: dto.sortOrder ?? 0, userId }),
    );
    return { id: saved.id, year: saved.year, sortOrder: saved.sortOrder, rows: [] };
  }

  async removeYear(id: number, userId: number): Promise<void> {
    const year = await this.yearsRepo.findOneBy({ id, userId });
    if (!year) {
      throw new NotFoundException('Год не найден');
    }
    const rows = await this.rowsRepo.find({ where: { yearId: id, userId } });
    for (const row of rows) {
      await this.subrowsRepo.delete({ rowId: row.id, userId });
    }
    await this.rowsRepo.delete({ yearId: id, userId });
    await this.yearsRepo.delete({ id, userId });
  }

  async createRow(dto: CreatePlanRowDto, userId: number): Promise<PlanRowResponse> {
    const year = await this.yearsRepo.findOneBy({ id: dto.yearId, userId });
    if (!year) {
      throw new NotFoundException('Год не найден');
    }
    if (dto.bookId != null) {
      await this.assertBook(dto.bookId, userId);
    }
    const saved = await this.rowsRepo.save(
      this.rowsRepo.create({
        yearId: dto.yearId,
        name: dto.name ?? '',
        purchased: false,
        bookId: dto.bookId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        userId,
      }),
    );
    return this.getRow(saved.id, userId);
  }

  async updateRow(id: number, dto: UpdatePlanRowDto, userId: number): Promise<PlanRowResponse> {
    const row = await this.getRowEntity(id, userId);
    const subcount = await this.subrowsRepo.count({ where: { rowId: id, userId } });

    if (dto.bookId !== undefined) {
      if (dto.bookId != null) {
        await this.assertBook(dto.bookId, userId);
      }
      row.bookId = dto.bookId;
    }
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;

    if (dto.purchased !== undefined && subcount === 0) {
      row.purchased = dto.purchased;
    }

    const saved = await this.rowsRepo.save(row);

    if (saved.bookId != null) {
      const shouldBought = dto.purchased !== undefined && subcount === 0
        ? dto.purchased
        : saved.purchased;
      await this.syncBookStatus(saved.bookId, shouldBought, userId);
    }

    return this.getRow(id, userId);
  }

  async removeRow(id: number, userId: number): Promise<void> {
    const row = await this.rowsRepo.findOneBy({ id, userId });
    if (!row) {
      throw new NotFoundException('Строка не найдена');
    }
    await this.subrowsRepo.delete({ rowId: id, userId });
    await this.rowsRepo.delete({ id, userId });
  }

  async createSubrow(dto: CreatePlanSubrowDto, userId: number): Promise<PlanSubrowMutationResult> {
    const row = await this.rowsRepo.findOneBy({ id: dto.rowId, userId });
    if (!row) {
      throw new NotFoundException('Строка не найдена');
    }
    if (dto.bookId != null) {
      await this.assertBook(dto.bookId, userId);
    }
    const saved = await this.subrowsRepo.save(
      this.subrowsRepo.create({
        rowId: dto.rowId,
        name: dto.name ?? '',
        purchased: false,
        bookId: dto.bookId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        userId,
      }),
    );
    await this.recomputeRow(dto.rowId, userId);
    return { row: await this.getRow(dto.rowId, userId), subrow: await this.getSubrow(saved.id, userId) };
  }

  async updateSubrow(id: number, dto: UpdatePlanSubrowDto, userId: number): Promise<PlanSubrowMutationResult> {
    const subrow = await this.subrowsRepo.findOneBy({ id, userId });
    if (!subrow) {
      throw new NotFoundException('Подстрока не найдена');
    }
    if (dto.bookId !== undefined) {
      if (dto.bookId != null) {
        await this.assertBook(dto.bookId, userId);
      }
      subrow.bookId = dto.bookId;
    }
    if (dto.name !== undefined) subrow.name = dto.name;
    if (dto.sortOrder !== undefined) subrow.sortOrder = dto.sortOrder;
    if (dto.purchased !== undefined) subrow.purchased = dto.purchased;

    const saved = await this.subrowsRepo.save(subrow);

    if (saved.bookId != null) {
      const shouldBought = dto.purchased !== undefined ? dto.purchased : saved.purchased;
      await this.syncBookStatus(saved.bookId, shouldBought, userId);
    }

    await this.recomputeRow(subrow.rowId, userId);
    return { row: await this.getRow(subrow.rowId, userId) };
  }

  async removeSubrow(id: number, userId: number): Promise<PlanSubrowMutationResult> {
    const subrow = await this.subrowsRepo.findOneBy({ id, userId });
    if (!subrow) {
      throw new NotFoundException('Подстрока не найдена');
    }
    const rowId = subrow.rowId;
    await this.subrowsRepo.delete({ id, userId });
    await this.recomputeRow(rowId, userId);
    return { row: await this.getRow(rowId, userId) };
  }

  private async recomputeRow(rowId: number, userId: number): Promise<void> {
    const row = await this.rowsRepo.findOneBy({ id: rowId });
    if (!row) return;
    const subrows = await this.subrowsRepo.find({ where: { rowId } });
    if (subrows.length === 0) return;
    const purchased = subrows.every((s) => s.purchased);
    if (purchased !== row.purchased) {
      row.purchased = purchased;
      await this.rowsRepo.save(row);
      if (row.bookId != null) {
        await this.syncBookStatus(row.bookId, purchased, userId);
      }
    }
  }

  private async syncBookStatus(bookId: number, purchased: boolean, userId: number): Promise<void> {
    const book = await this.booksRepo.findOneBy({ id: bookId, userId });
    if (!book) return;
    const status = purchased ? BookStatus.BOUGHT : BookStatus.WISHLIST;
    if (book.status !== status) {
      book.status = status;
      await this.booksRepo.save(book);
    }
  }

  private async assertBook(bookId: number, userId: number): Promise<void> {
    const book = await this.booksRepo.findOneBy({ id: bookId, userId });
    if (!book) {
      throw new NotFoundException('Книга не найдена');
    }
  }

  private async getRowEntity(id: number, userId: number): Promise<PurchasePlanRow> {
    const row = await this.rowsRepo.findOneBy({ id, userId });
    if (!row) {
      throw new NotFoundException('Строка не найдена');
    }
    return row;
  }

  private async getRow(id: number, userId: number): Promise<PlanRowResponse> {
    const row = await this.rowsRepo.findOne({
      where: { id, userId },
      relations: { subrows: { book: true }, book: true },
    });
    if (!row) {
      throw new NotFoundException('Строка не найдена');
    }
    return this.serializeRow(row);
  }

  private async getSubrow(id: number, userId: number): Promise<PlanSubrowResponse> {
    const subrow = await this.subrowsRepo.findOne({
      where: { id, userId },
      relations: { book: true },
    });
    if (!subrow) {
      throw new NotFoundException('Подстрока не найдена');
    }
    return this.serializeSubrow(subrow);
  }

  private serializeYear(year: PurchasePlanYear): PlanYearResponse {
    return {
      id: year.id,
      year: year.year,
      sortOrder: year.sortOrder,
      rows: [...year.rows]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
        .map((row) => this.serializeRow(row)),
    };
  }

  private serializeRow(row: PurchasePlanRow): PlanRowResponse {
    return {
      id: row.id,
      yearId: row.yearId,
      name: row.name,
      purchased: row.purchased,
      bookId: row.bookId,
      book: this.serializeBook(row.book),
      sortOrder: row.sortOrder,
      subrows: [...row.subrows]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
        .map((subrow) => this.serializeSubrow(subrow)),
    };
  }

  private serializeSubrow(subrow: PurchasePlanSubrow): PlanSubrowResponse {
    return {
      id: subrow.id,
      rowId: subrow.rowId,
      name: subrow.name,
      purchased: subrow.purchased,
      bookId: subrow.bookId,
      book: this.serializeBook(subrow.book),
      sortOrder: subrow.sortOrder,
    };
  }

  private serializeBook(book: Book | null): PlanBookRef | null {
    return book ? { id: book.id, title: book.title } : null;
  }
}