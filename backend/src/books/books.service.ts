import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { BookStatus } from '../common/book-status.enum';
import { PurchasePlanRow } from '../plans/purchase-plan-row.entity';
import { PurchasePlanSubrow } from '../plans/purchase-plan-subrow.entity';
import { CreateBookDto, UpdateBookDto } from './dto/book.dto';

export interface BookQuery {
  categories?: string;
  genres?: string;
  statuses?: string;
  search?: string;
}

function toIdArray(value: string | undefined): number[] | null {
  if (!value) return null;
  const ids = value
    .split(',')
    .map((v) => parseInt(v.trim(), 10))
    .filter((v) => !isNaN(v));
  return ids.length > 0 ? ids : null;
}

function toStatusArray(value: string | undefined): BookStatus[] | null {
  if (!value) return null;
  const statuses = value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => (Object.values(BookStatus) as string[]).includes(v)) as BookStatus[];
  return statuses.length > 0 ? statuses : null;
}

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly repo: Repository<Book>,
    @InjectRepository(PurchasePlanRow)
    private readonly planRows: Repository<PurchasePlanRow>,
    @InjectRepository(PurchasePlanSubrow)
    private readonly planSubrows: Repository<PurchasePlanSubrow>,
  ) {}

  async findAll(
    query: BookQuery,
    offset = 0,
    limit = 30,
    userId?: number,
  ): Promise<{ items: Book[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category')
      .leftJoinAndSelect('book.genre', 'genre')
      .orderBy('book.createdAt', 'DESC');

    if (userId != null) {
      qb.andWhere('book.userId = :userId', { userId });
    }

    const categories = toIdArray(query.categories);
    if (categories) {
      qb.andWhere('book.categoryId IN (:...categories)', { categories });
    }

    const genres = toIdArray(query.genres);
    if (genres) {
      qb.andWhere('book.genreId IN (:...genres)', { genres });
    }

    const statuses = toStatusArray(query.statuses);
    if (statuses) {
      qb.andWhere('book.status IN (:...statuses)', { statuses });
    }

    const rows = await qb.getMany();

    let items = rows;
    const search = query.search?.trim();
    if (search) {
      const term = search.toLowerCase();
      items = rows.filter(
        (book) =>
          book.title.toLowerCase().includes(term) ||
          book.author.toLowerCase().includes(term),
      );
    }

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    };
  }

  async findAuthors(userId?: number): Promise<string[]> {
    const qb = this.repo
      .createQueryBuilder('book')
      .select('DISTINCT book.author')
      .where("book.author != ''")
      .andWhere("book.author IS NOT NULL")
      .orderBy('book.author', 'ASC');

    if (userId != null) {
      qb.andWhere('book.userId = :userId', { userId });
    }

    const rows = await qb.getRawMany<{ author: string }>();
    return rows.map((r) => r.author);
  }

  async findAllRaw(userId?: number): Promise<Book[]> {
    const where: Record<string, unknown> = {};
    if (userId != null) where.userId = userId;
    return this.repo.find({
      where,
      relations: { category: true, genre: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId?: number): Promise<Book> {
    const where: Record<string, unknown> = { id };
    if (userId != null) where.userId = userId;
    const book = await this.repo.findOne({
      where,
      relations: { category: true, genre: true },
    });
    if (!book) {
      throw new NotFoundException('Книга не найдена');
    }
    return book;
  }

  async create(dto: CreateBookDto, userId: number): Promise<Book> {
    const book = this.repo.create({ ...dto, userId });
    return this.repo.save(book);
  }

  async update(id: number, dto: UpdateBookDto, userId: number): Promise<Book> {
    const existing = await this.findOne(id, userId);
    const statusChanged = dto.status !== undefined && dto.status !== existing.status;
    const payload = { ...dto };
    const now = new Date();
    if (statusChanged && dto.status === BookStatus.READ) {
      if (payload.readYear == null) payload.readYear = now.getFullYear();
      if (payload.readMonth == null) payload.readMonth = now.getMonth() + 1;
    }
    await this.repo.update({ id, userId }, payload);
    if (statusChanged) {
      await this.syncPlanFlags(id, dto.status!, userId);
    }
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const book = await this.findOne(id, userId);
    await this.planSubrows.update({ bookId: id }, { bookId: null });
    await this.planRows.update({ bookId: id }, { bookId: null });
    await this.repo.delete({ id, userId });
  }

  private async syncPlanFlags(bookId: number, status: BookStatus, userId: number): Promise<void> {
    const purchased = status === BookStatus.BOUGHT;

    const rows = await this.planRows.find({ where: { bookId, userId } });
    for (const row of rows) {
      const subcount = await this.planSubrows.count({ where: { rowId: row.id, userId } });
      if (subcount === 0 && row.purchased !== purchased) {
        row.purchased = purchased;
        await this.planRows.save(row);
      }
    }

    const subrows = await this.planSubrows.find({ where: { bookId, userId } });
    for (const subrow of subrows) {
      if (subrow.purchased !== purchased) {
        subrow.purchased = purchased;
        await this.planSubrows.save(subrow);
        await this.recomputePlanRow(subrow.rowId, userId);
      }
    }
  }

  private async recomputePlanRow(rowId: number, userId: number): Promise<void> {
    const row = await this.planRows.findOneBy({ id: rowId });
    if (!row) return;
    const subrows = await this.planSubrows.find({ where: { rowId } });
    if (subrows.length === 0) return;
    const purchased = subrows.every((s) => s.purchased);
    if (purchased !== row.purchased) {
      row.purchased = purchased;
      await this.planRows.save(row);
      if (row.bookId != null && row.bookId !== undefined) {
        const linked = await this.repo.findOneBy({ id: row.bookId, userId });
        if (linked) {
          const status = purchased ? BookStatus.BOUGHT : BookStatus.WISHLIST;
          if (linked.status !== status) {
            linked.status = status;
            await this.repo.save(linked);
          }
        }
      }
    }
  }
}