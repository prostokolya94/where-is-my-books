import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityTarget } from 'typeorm';
import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { UserDump } from './user-dump.entity';
import { AuthUser } from '../auth/current-user.decorator';
import { User } from '../auth/user.entity';
import { Book } from '../books/book.entity';
import { Category } from '../categories/category.entity';
import { Genre } from '../genres/genre.entity';
import { Tab } from '../tabs/tab.entity';
import { CostAccount } from '../costs/cost-account.entity';
import { PurchasePlanYear } from '../plans/purchase-plan-year.entity';
import { PurchasePlanRow } from '../plans/purchase-plan-row.entity';
import { PurchasePlanSubrow } from '../plans/purchase-plan-subrow.entity';
import { UnreadCategoryTarget } from '../unread/unread-category-target.entity';
import { UnreadGenreTarget } from '../unread/unread-genre-target.entity';
import { UnreadSnapshot } from '../unread/unread-snapshot.entity';

const MAX_DUMPS = 3;
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
const SCHEMA_VERSION = '1';
const DUMP_PREFIX = 'books-';
const DUMP_SUFFIX = '.sqlite';

const DATE_COLUMNS = new Set(['createdAt', 'updatedAt']);
const BOOL_COLUMNS = new Set(['purchased']);

interface JsonRef {
  jsonKey: string;
  parentTable: string;
}

interface TableConfig {
  name: string;
  entity: EntityTarget<unknown>;
  columns: string[];
  fks?: { column: string; parent: string }[];
  jsonRefs?: { column: string; refs: JsonRef[] };
}

export interface DumpInfo {
  id: number;
  name: string;
  size: number;
  source: 'server' | 'upload';
  createdAt: string;
}

const TABLES: TableConfig[] = [
  {
    name: 'categories',
    entity: Category,
    columns: ['name', 'sortOrder', 'createdAt', 'updatedAt'],
  },
  {
    name: 'genres',
    entity: Genre,
    columns: ['name', 'categoryId', 'sortOrder', 'createdAt', 'updatedAt'],
    fks: [{ column: 'categoryId', parent: 'categories' }],
  },
  {
    name: 'books',
    entity: Book,
    columns: [
      'title',
      'author',
      'purchaseYear',
      'readYear',
      'readMonth',
      'status',
      'categoryId',
      'genreId',
      'price',
      'createdAt',
      'updatedAt',
    ],
    fks: [
      { column: 'categoryId', parent: 'categories' },
      { column: 'genreId', parent: 'genres' },
    ],
  },
  {
    name: 'purchase_plan_years',
    entity: PurchasePlanYear,
    columns: ['year', 'sortOrder', 'createdAt', 'updatedAt'],
  },
  {
    name: 'purchase_plan_rows',
    entity: PurchasePlanRow,
    columns: ['yearId', 'name', 'purchased', 'bookId', 'sortOrder', 'createdAt', 'updatedAt'],
    fks: [
      { column: 'yearId', parent: 'purchase_plan_years' },
      { column: 'bookId', parent: 'books' },
    ],
  },
  {
    name: 'purchase_plan_subrows',
    entity: PurchasePlanSubrow,
    columns: ['rowId', 'name', 'purchased', 'bookId', 'sortOrder', 'createdAt', 'updatedAt'],
    fks: [
      { column: 'rowId', parent: 'purchase_plan_rows' },
      { column: 'bookId', parent: 'books' },
    ],
  },
  {
    name: 'tabs',
    entity: Tab,
    columns: ['name', 'filtersJson', 'sortOrder', 'createdAt', 'updatedAt'],
    jsonRefs: {
      column: 'filtersJson',
      refs: [
        { jsonKey: 'categories', parentTable: 'categories' },
        { jsonKey: 'genres', parentTable: 'genres' },
      ],
    },
  },
  {
    name: 'cost_accounts',
    entity: CostAccount,
    columns: ['name', 'filtersJson', 'sortOrder', 'createdAt', 'updatedAt'],
    jsonRefs: {
      column: 'filtersJson',
      refs: [
        { jsonKey: 'categories', parentTable: 'categories' },
        { jsonKey: 'genres', parentTable: 'genres' },
      ],
    },
  },
  {
    name: 'unread_category_targets',
    entity: UnreadCategoryTarget,
    columns: ['categoryId', 'target', 'createdAt', 'updatedAt'],
    fks: [{ column: 'categoryId', parent: 'categories' }],
  },
  {
    name: 'unread_genre_targets',
    entity: UnreadGenreTarget,
    columns: ['genreId', 'target', 'createdAt', 'updatedAt'],
    fks: [{ column: 'genreId', parent: 'genres' }],
  },
  {
    name: 'unread_monthly_snapshots',
    entity: UnreadSnapshot,
    columns: ['year', 'month', 'total', 'createdAt'],
  },
];

@Injectable()
export class DumpsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async list(userId: number): Promise<DumpInfo[]> {
    const rows = await this.dataSource
      .getRepository(UserDump)
      .find({ where: { userId }, order: { createdAt: 'DESC' } });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      size: r.size,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async create(userId: number, login: string): Promise<DumpInfo[]> {
    const repo = this.dataSource.getRepository(UserDump);
    const last = await repo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const now = new Date();
    if (last && this.sameDay(last.createdAt, now)) {
      throw new BadRequestException(
        'Личная версия на сегодня уже создана. Следующую можно сделать завтра.',
      );
    }
    await this.enforceMax(userId);
    const buffer = await this.buildDump(userId, login);
    const name = `${DUMP_PREFIX}${formatDateTime(now)}${DUMP_SUFFIX}`;
    await repo.save(
      repo.create({
        userId,
        name,
        size: buffer.length,
        source: 'server',
        data: buffer,
      }),
    );
    return this.list(userId);
  }

  async remove(userId: number, dumpId: number): Promise<DumpInfo[]> {
    const dump = await this.getOwned(userId, dumpId);
    await this.dataSource.getRepository(UserDump).delete(dump.id);
    return this.list(userId);
  }

  async apply(userId: number, dumpId: number): Promise<void> {
    const dump = await this.getOwned(userId, dumpId);
    if (!dump.data) {
      throw new BadRequestException('Дамп повреждён: нет данных');
    }
    const parsed = this.readDump(dump.data);
    this.assertValid(parsed);

    await this.dataSource.transaction(async (manager) => {
      for (const table of [...TABLES].reverse()) {
        await manager.getRepository(table.entity).delete({ userId });
      }

      const idMaps: Record<string, Map<number, number>> = {};
      for (const table of TABLES) {
        idMaps[table.name] = new Map();
        const rows = parsed.tables[table.name] ?? [];
        const repo = manager.getRepository(table.entity);
        for (const row of rows) {
          const record: Record<string, unknown> = { userId };
          for (const column of table.columns) {
            record[column] = this.toDbValue(table, column, row[column], idMaps);
          }
          const saved = await repo.save(repo.create(record)) as { id: number };
          if (row.id != null) {
            idMaps[table.name].set(Number(row.id), saved.id);
          }
        }
      }
    });
  }

  async download(
    user: AuthUser,
    dumpId: number,
  ): Promise<{ data: Buffer; name: string }> {
    await this.ensureCanDownload(user.id);
    const dump = await this.getOwned(user.id, dumpId);
    if (!dump.data) {
      throw new BadRequestException('Дамп повреждён: нет данных');
    }
    return { data: dump.data, name: dump.name };
  }

  async upload(
    user: AuthUser,
    file: { originalname: string; size: number; buffer: Buffer },
  ): Promise<DumpInfo[]> {
    await this.ensureCanDownload(user.id);
    if (!file?.buffer) {
      throw new BadRequestException('Файл не получен');
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      throw new BadRequestException('Файл слишком большой (максимум 50 МБ)');
    }
    this.assertValid(this.readDump(file.buffer));

    await this.enforceMax(user.id);
    const repo = this.dataSource.getRepository(UserDump);
    const baseName = sanitizeBaseName(file.originalname);
    const name = `${baseName}-${formatDateTime(new Date())}${DUMP_SUFFIX}`;
    await repo.save(
      repo.create({
        userId: user.id,
        name,
        size: file.size,
        source: 'upload',
        data: file.buffer,
      }),
    );
    return this.list(user.id);
  }

  private async enforceMax(userId: number): Promise<void> {
    const repo = this.dataSource.getRepository(UserDump);
    const rows = await repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    if (rows.length >= MAX_DUMPS) {
      const toDelete = rows.slice(0, rows.length - MAX_DUMPS + 1);
      for (const row of toDelete) {
        await repo.delete(row.id);
      }
    }
  }

  private async getOwned(userId: number, dumpId: number): Promise<UserDump> {
    const dump = await this.dataSource.getRepository(UserDump).findOneBy({
      id: dumpId,
      userId,
    });
    if (!dump) {
      throw new NotFoundException('Личная версия не найдена');
    }
    return dump;
  }

  private async ensureCanDownload(userId: number): Promise<void> {
    const user = await this.dataSource
      .getRepository(User)
      .findOneBy({ id: userId });
    if (!user || user.canDownloadHisOwnDataBase !== true) {
      throw new ForbiddenException(
        'Скачивание базы недоступно для этой учётной записи',
      );
    }
  }

  private async buildDump(
    userId: number,
    login: string,
  ): Promise<Buffer> {
    const dir = mkdtempSync(join(tmpdir(), 'wimb-dump-'));
    const file = join(dir, 'dump.sqlite');
    try {
      const db = new Database(file);
      db.pragma('journal_mode = OFF');
      db.exec(
        'CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
      );
      for (const table of TABLES) {
        const columns = ['id', ...table.columns].map((c) => `"${c}"`).join(', ');
        db.exec(`CREATE TABLE "${table.name}" (${columns});`);
      }
      const insertMeta = db.prepare(
        'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
      );
      insertMeta.run('schema_version', SCHEMA_VERSION);
      insertMeta.run('created_by', login);
      insertMeta.run('created_at', new Date().toISOString());

      for (const table of TABLES) {
        const rows = await this.dataSource
          .getRepository(table.entity)
          .find({ where: { userId } });
        if (rows.length === 0) continue;
        const columns = ['id', ...table.columns];
        const insert = db.prepare(
          `INSERT INTO "${table.name}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
        );
        const writeRows = db.transaction((items: Record<string, unknown>[]) => {
          for (const row of items) {
            insert.run(...columns.map((c) => this.toDumpValue(row[c])));
          }
        });
        writeRows(rows as Record<string, unknown>[]);
      }
      db.close();
      return readFileSync(file);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  private readDump(buffer: Buffer): {
    tables: Record<string, Record<string, unknown>[]>;
    meta: Record<string, string>;
  } {
    const dir = mkdtempSync(join(tmpdir(), 'wimb-read-'));
    const file = join(dir, 'dump.sqlite');
    let db: Database.Database | null = null;
    try {
      writeFileSync(file, buffer);
      db = new Database(file, { readonly: true });
      const tables: Record<string, Record<string, unknown>[]> = {};
      for (const table of TABLES) {
        const exists = db
          .prepare(
            `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
          )
          .get(table.name);
        tables[table.name] = exists
          ? (db
              .prepare(`SELECT * FROM "${table.name}"`)
              .all() as Record<string, unknown>[])
          : [];
      }
      const hasMeta = db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'meta'`)
        .get();
      const meta: Record<string, string> = {};
      if (hasMeta) {
        const metaRows = db
          .prepare('SELECT key, value FROM meta')
          .all() as { key: string; value: string }[];
        for (const row of metaRows) {
          meta[row.key] = row.value;
        }
      }
      return { tables, meta };
    } catch (e) {
      throw new BadRequestException(
        `Файл не похож на базу данных Where Is My Books${e instanceof Error ? `: ${e.message}` : ''}`,
      );
    } finally {
      try {
        db?.close();
      } catch {
        // ignore
      }
      rmSync(dir, { recursive: true, force: true });
    }
  }

  private assertValid(parsed: {
    meta: Record<string, string>;
  }): void {
    if (
      parsed.meta.schema_version &&
      parsed.meta.schema_version !== SCHEMA_VERSION
    ) {
      throw new BadRequestException(
        'Файл не подходит: несовместимая версия дампа',
      );
    }
  }

  private toDumpValue(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  }

  private toDbValue(
    table: TableConfig,
    column: string,
    value: unknown,
    idMaps: Record<string, Map<number, number>>,
  ): unknown {
    if (value === null || value === undefined) return null;
    if (DATE_COLUMNS.has(column)) {
      return new Date(String(value));
    }
    if (BOOL_COLUMNS.has(column)) {
      return value === 1 || value === true;
    }
    if (table.jsonRefs?.column === column) {
      return remapJson(String(value), table.jsonRefs.refs, idMaps);
    }
    const fk = table.fks?.find((f) => f.column === column);
    if (fk) {
      const map = idMaps[fk.parent];
      const id = Number(value);
      if (map && map.has(id)) return map.get(id);
      return null;
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}

function remapJson(
  json: string,
  refs: JsonRef[],
  idMaps: Record<string, Map<number, number>>,
): string {
  try {
    const obj = JSON.parse(json);
    if (obj && typeof obj === 'object') {
      for (const ref of refs) {
        if (Array.isArray(obj[ref.jsonKey])) {
          const map = idMaps[ref.parentTable] ?? new Map();
          obj[ref.jsonKey] = obj[ref.jsonKey]
            .map((id: unknown) => {
              const numeric = Number(id);
              return map.has(numeric) ? map.get(numeric) : null;
            })
            .filter((id: number | null) => id != null);
        }
      }
    }
    return JSON.stringify(obj);
  } catch {
    return json;
  }
}

function sanitizeBaseName(name: string): string {
  const cleaned = name.replace(/\.sqlite$/i, '').trim();
  if (!cleaned) return 'books-upload';
  return cleaned.slice(0, 60).replace(/[\\/:*?"<>|]/g, '-');
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}