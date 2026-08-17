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
  ): Promise<{ items: Book[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category')
      .leftJoinAndSelect('book.genre', 'genre')
      .orderBy('book.createdAt', 'DESC');

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

  async findAllRaw(): Promise<Book[]> {
    return this.repo.find({
      relations: { category: true, genre: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.repo.findOne({
      where: { id },
      relations: { category: true, genre: true },
    });
    if (!book) {
      throw new NotFoundException('Книга не найдена');
    }
    return book;
  }

  async create(dto: CreateBookDto): Promise<Book> {
    const book = this.repo.create(dto);
    return this.repo.save(book);
  }

  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    const statusChanged = dto.status !== undefined && dto.status !== book.status;
    Object.assign(book, dto);
    const saved = await this.repo.save(book);
    if (statusChanged) {
      await this.syncPlanFlags(saved.id, saved.status);
    }
    return saved;
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    await this.planSubrows.update({ bookId: id }, { bookId: null });
    await this.planRows.update({ bookId: id }, { bookId: null });
    await this.repo.delete(id);
  }

  private async syncPlanFlags(bookId: number, status: BookStatus): Promise<void> {
    const purchased = status === BookStatus.BOUGHT;

    const rows = await this.planRows.find({ where: { bookId } });
    for (const row of rows) {
      const subcount = await this.planSubrows.count({ where: { rowId: row.id } });
      if (subcount === 0 && row.purchased !== purchased) {
        row.purchased = purchased;
        await this.planRows.save(row);
      }
    }

    const subrows = await this.planSubrows.find({ where: { bookId } });
    for (const subrow of subrows) {
      if (subrow.purchased !== purchased) {
        subrow.purchased = purchased;
        await this.planSubrows.save(subrow);
        await this.recomputePlanRow(subrow.rowId);
      }
    }
  }

  private async recomputePlanRow(rowId: number): Promise<void> {
    const row = await this.planRows.findOneBy({ id: rowId });
    if (!row) return;
    const subrows = await this.planSubrows.find({ where: { rowId } });
    if (subrows.length === 0) return;
    const purchased = subrows.every((s) => s.purchased);
    if (purchased !== row.purchased) {
      row.purchased = purchased;
      await this.planRows.save(row);
      if (row.bookId != null && row.bookId !== undefined) {
        const linked = await this.repo.findOneBy({ id: row.bookId });
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
