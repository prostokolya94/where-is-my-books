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

  async findAll(userId: number): Promise<Genre[]> {
    return this.repo.find({
      where: { userId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Genre> {
    const genre = await this.repo.findOneBy({ id, userId });
    if (!genre) {
      throw new NotFoundException('Жанр не найден');
    }
    return genre;
  }

  async create(dto: CreateGenreDto, userId: number): Promise<Genre> {
    const categoryId = dto.categoryId ?? null;
    const count = await this.repo.countBy({ userId, categoryId });
    const genre = this.repo.create({
      ...dto,
      userId,
      categoryId,
      sortOrder: dto.sortOrder ?? count,
    });
    return this.repo.save(genre);
  }

  async reorder(ids: number[], userId: number): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.repo.update({ id: ids[i], userId }, { sortOrder: i });
    }
  }

  async update(id: number, dto: UpdateGenreDto, userId: number): Promise<Genre> {
    const genre = await this.findOne(id, userId);
    Object.assign(genre, dto);
    return this.repo.save(genre);
  }

  async remove(id: number, userId: number): Promise<void> {
    const genre = await this.findOne(id, userId);

    await this.bookRepo
      .createQueryBuilder()
      .update(Book)
      .set({ genreId: null })
      .where('genreId = :id AND "userId" = :userId', { id, userId })
      .execute();

    await this.repo.delete(id);
  }
}