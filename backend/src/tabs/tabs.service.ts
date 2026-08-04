import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tab, TabFilters } from './tab.entity';
import { CreateTabDto, UpdateTabDto } from './dto/tab.dto';

@Injectable()
export class TabsService {
  constructor(
    @InjectRepository(Tab)
    private readonly repo: Repository<Tab>,
  ) {}

  private static toFilters(dto: CreateTabDto | UpdateTabDto): string {
    return JSON.stringify({
      categories: dto.filters?.categories ?? [],
      genres: dto.filters?.genres ?? [],
      statuses: dto.filters?.statuses ?? [],
      search: dto.filters?.search ?? '',
    });
  }

  async findAll(): Promise<Tab[]> {
    const tabs = await this.repo.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return tabs.map((tab) => this.serialize(tab));
  }

  async findOne(id: number): Promise<Tab> {
    const tab = await this.repo.findOneBy({ id });
    if (!tab) {
      throw new NotFoundException('Таб не найден');
    }
    return this.serialize(tab);
  }

  async create(dto: CreateTabDto): Promise<Tab> {
    const tab = this.repo.create({
      name: dto.name,
      filtersJson: TabsService.toFilters(dto),
      sortOrder: dto.sortOrder ?? 0,
    });
    const saved = await this.repo.save(tab);
    return this.serialize(saved);
  }

  async update(id: number, dto: UpdateTabDto): Promise<Tab> {
    const tab = await this.repo.findOneBy({ id });
    if (!tab) {
      throw new NotFoundException('Таб не найден');
    }
    if (dto.name !== undefined) tab.name = dto.name;
    if (dto.sortOrder !== undefined) tab.sortOrder = dto.sortOrder;
    if (dto.filters !== undefined) tab.filtersJson = TabsService.toFilters(dto);
    const saved = await this.repo.save(tab);
    return this.serialize(saved);
  }

  async remove(id: number): Promise<void> {
    const tab = await this.repo.findOneBy({ id });
    if (!tab) {
      throw new NotFoundException('Таб не найден');
    }
    await this.repo.delete(id);
  }

  private serialize(tab: Tab): Tab & { filters: TabFilters } {
    return {
      ...tab,
      filters: tab.filters,
    };
  }
}
