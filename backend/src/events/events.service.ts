import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UserEvent } from './user-event.entity';

export interface EventSummaryRow {
  type: string;
  count: number;
  lastAt: Date | null;
}

const RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(UserEvent)
    private readonly repo: Repository<UserEvent>,
  ) {}

  onModuleInit(): void {
    this.cleanup().catch(() => {
      /* ignore */
    });
    this.timer = setInterval(() => {
      this.cleanup().catch(() => {
        /* ignore */
      });
    }, CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async record(
    userId: number,
    type: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({ userId, type, payload: payload ?? null }),
      );
    } catch {
      // метрики не должны ронять приложение
    }
  }

  async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_MS);
    await this.repo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoff', { cutoff })
      .execute();
  }

  async summary(query: {
    from?: string;
    to?: string;
    userId?: number;
  }): Promise<EventSummaryRow[]> {
    const rows = await this.buildSummaryQuery(null, query).getRawMany<{
      type: string;
      count: string;
      lastAt: Date | null;
    }>();
    return rows.map((row) => ({
      type: row.type,
      count: Number(row.count),
      lastAt: row.lastAt ?? null,
    }));
  }

  async breakdown(query: {
    type: string;
    key?: string;
    from?: string;
    to?: string;
    userId?: number;
  }): Promise<EventSummaryRow[]> {
    const key = query.key === 'page' ? 'page' : 'page';
    const ref = `e.payload->>'${key}'`;
    const qb = this.repo
      .createQueryBuilder('e')
      .select(ref, 'value')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(e.createdAt)', 'lastAt')
      .where('e.type = :type', { type: query.type })
      .groupBy(ref)
      .orderBy('"count"', 'DESC');
    this.applyRange(qb, query);
    const rows = await qb.getRawMany<{
      value: string | null;
      count: string;
      lastAt: Date | null;
    }>();
    return rows.map((row) => ({
      type: row.value ?? '(без значения)',
      count: Number(row.count),
      lastAt: row.lastAt ?? null,
    }));
  }

  private buildSummaryQuery(
    type: string | null,
    query: { from?: string; to?: string; userId?: number },
  ): SelectQueryBuilder<UserEvent> {
    const qb = this.repo
      .createQueryBuilder('e')
      .select('e.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(e.createdAt)', 'lastAt')
      .groupBy('e.type')
      .orderBy('"count"', 'DESC');
    if (type) {
      qb.andWhere('e.type = :type', { type });
    }
    this.applyRange(qb, query);
    return qb;
  }

  private applyRange(
    qb: SelectQueryBuilder<UserEvent>,
    query: { from?: string; to?: string; userId?: number },
  ): void {
    if (query.userId) {
      qb.andWhere('e.userId = :userId', { userId: query.userId });
    }
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from && !isNaN(from.getTime())) {
      qb.andWhere('e.createdAt >= :from', { from });
    }
    if (to && !isNaN(to.getTime())) {
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      qb.andWhere('e.createdAt <= :toEnd', { toEnd });
    }
  }
}