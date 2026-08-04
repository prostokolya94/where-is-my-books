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

  async findAll(): Promise<Category[]> {
    return this.repo.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.repo.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Категория не найдена');
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const count = await this.repo.count();
    const category = this.repo.create({
      ...dto,
      sortOrder: dto.sortOrder ?? count,
    });
    return this.repo.save(category);
  }

  async reorder(ids: number[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.repo.update(ids[i], { sortOrder: i });
    }
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);

    const genres = await this.genreRepo.find({ where: { categoryId: id } });
    const genreIds = genres.map((g) => g.id);

    if (genreIds.length > 0) {
      await this.bookRepo
        .createQueryBuilder()
        .update(Book)
        .set({ genreId: null })
        .where('genreId IN (:...ids)', { ids: genreIds })
        .execute();
      await this.genreRepo.delete({ categoryId: id });
    }

    await this.bookRepo
      .createQueryBuilder()
      .update(Book)
      .set({ categoryId: null })
      .where('categoryId = :id', { id })
      .execute();

    await this.repo.delete(id);
  }
}
