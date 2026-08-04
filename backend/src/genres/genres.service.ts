import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './genre.entity';
import { Book } from '../books/book.entity';
import { CreateGenreDto, UpdateGenreDto } from './dto/genre.dto';

@Injectable()
export class GenresService {
  constructor(
    @InjectRepository(Genre)
    private readonly repo: Repository<Genre>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async findAll(): Promise<Genre[]> {
    return this.repo.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Genre> {
    const genre = await this.repo.findOneBy({ id });
    if (!genre) {
      throw new NotFoundException('Жанр не найден');
    }
    return genre;
  }

  async create(dto: CreateGenreDto): Promise<Genre> {
    const categoryId = dto.categoryId ?? null;
    const count = await this.repo.countBy({ categoryId });
    const genre = this.repo.create({
      ...dto,
      categoryId,
      sortOrder: dto.sortOrder ?? count,
    });
    return this.repo.save(genre);
  }

  async reorder(ids: number[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.repo.update(ids[i], { sortOrder: i });
    }
  }

  async update(id: number, dto: UpdateGenreDto): Promise<Genre> {
    const genre = await this.findOne(id);
    Object.assign(genre, dto);
    return this.repo.save(genre);
  }

  async remove(id: number): Promise<void> {
    const genre = await this.findOne(id);

    await this.bookRepo
      .createQueryBuilder()
      .update(Book)
      .set({ genreId: null })
      .where('genreId = :id', { id })
      .execute();

    await this.repo.delete(id);
  }
}
