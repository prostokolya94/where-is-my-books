import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { BookStatus } from '../common/book-status.enum';
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
  ) {}

  async findAll(query: BookQuery): Promise<Book[]> {
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

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      qb.andWhere('(book.title LIKE :term OR book.author LIKE :term)', {
        term: `%${term}%`,
      });
    }

    return qb.getMany();
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
    Object.assign(book, dto);
    return this.repo.save(book);
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    await this.repo.delete(id);
  }
}
