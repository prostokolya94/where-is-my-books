import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { Genre } from '../genres/genre.entity';
import { Book } from '../books/book.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async findAll(userId: number): Promise<Category[]> {
    return this.repo.find({
      where: { userId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Category> {
    const category = await this.repo.findOneBy({ id, userId });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }
    return category;
  }

  async create(dto: CreateCategoryDto, userId: number): Promise<Category> {
    const count = await this.repo.countBy({ userId });
    const category = this.repo.create({
      ...dto,
      userId,
      sortOrder: dto.sortOrder ?? count,
    });
    return this.repo.save(category);
  }

  async reorder(ids: number[], userId: number): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.repo.update({ id: ids[i], userId }, { sortOrder: i });
    }
  }

  async update(id: number, dto: UpdateCategoryDto, userId: number): Promise<Category> {
    const category = await this.findOne(id, userId);
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  async remove(id: number, userId: number): Promise<void> {
    const category = await this.findOne(id, userId);

    const genres = await this.genreRepo.find({ where: { categoryId: id, userId } });
    const genreIds = genres.map((g) => g.id);

    if (genreIds.length > 0) {
      await this.bookRepo
        .createQueryBuilder()
        .update(Book)
        .set({ genreId: null })
        .where('genreId IN (:...ids) AND "userId" = :userId', { ids: genreIds, userId })
        .execute();
      await this.genreRepo.delete({ categoryId: id, userId });
    }

    await this.bookRepo
      .createQueryBuilder()
      .update(Book)
      .set({ categoryId: null })
      .where('categoryId = :id AND "userId" = :userId', { id, userId })
      .execute();

    await this.repo.delete(id);
  }
}