import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

const BACKUP_PREFIX = 'books-';
const BACKUP_SUFFIX = '.sqlite';
const MAX_BACKUPS = 3;
const BACKUP_NAME_RE = /^books-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.sqlite$/;

export interface BackupInfo {
  name: string;
  size: number;
  createdAt: string;
}

export interface CreateBackupResult {
  backups: BackupInfo[];
  deleted: string | null;
}

@Injectable()
export class BackupsService {
  private readonly backupDir = join(process.cwd(), 'data', 'backups');

  constructor(private readonly dataSource: DataSource) {}

  list(): BackupInfo[] {
    this.ensureDir();
    const files = this.listFiles();
    return files.map((name) => {
      const size = statSync(join(this.backupDir, name)).size;
      const createdAt = name.slice(BACKUP_PREFIX.length, -BACKUP_SUFFIX.length);
      return { name, size, createdAt };
    });
  }

  async create(): Promise<CreateBackupResult> {
    this.ensureDir();
    const existing = this.listFiles();
    const now = new Date();
    const today = this.formatDate(now);

    if (existing.some((f) => f.startsWith(`${BACKUP_PREFIX}${today}`))) {
      throw new BadRequestException(
        'Резервная копия на сегодня уже создана. Следующую можно сделать завтра.',
      );
    }

    const name = `${BACKUP_PREFIX}${this.formatDateTime(now)}${BACKUP_SUFFIX}`;
    const target = join(this.backupDir, name);
    await this.dataSource.query(`VACUUM INTO '${this.escapeSqlLiteral(target)}'`);

    const files = this.listFiles();
    let deleted: string | null = null;
    if (files.length > MAX_BACKUPS) {
      const oldest = files[0];
      if (oldest !== name) {
        unlinkSync(join(this.backupDir, oldest));
        deleted = oldest;
      }
    }

    return { backups: this.list(), deleted };
  }

  delete(name: string): BackupInfo[] {
    const file = this.resolve(name);
    unlinkSync(file);
    return this.list();
  }

  async apply(name: string): Promise<void> {
    const file = this.resolve(name);
    await this.dataSource.query('BEGIN');
    try {
      await this.dataSource.query('PRAGMA defer_foreign_keys = ON');
      await this.dataSource.query(
        `ATTACH DATABASE '${this.escapeSqlLiteral(file)}' AS src`,
      );
      const tables = await this.dataSource.query<{ name: string }[]>(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('__typeorm_migrations')`,
      );
      for (const row of tables) {
        const table = this.quoteTable(row.name);
        await this.dataSource.query(`DELETE FROM ${table}`);
        await this.dataSource.query(
          `INSERT INTO ${table} SELECT * FROM src.${table}`,
        );
      }
      const hasSequence = await this.dataSource.query<{ name: string }[]>(
        `SELECT name FROM src.sqlite_master WHERE type='table' AND name='sqlite_sequence'`,
      );
      if (hasSequence.length > 0) {
        await this.dataSource.query('DELETE FROM sqlite_sequence');
        await this.dataSource.query(
          'INSERT INTO sqlite_sequence SELECT * FROM src.sqlite_sequence',
        );
      }
      await this.dataSource.query('COMMIT');
    } catch (e) {
      await this.dataSource.query('ROLLBACK');
      const message = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(
        `Не удалось применить резервную копию: ${message}`,
      );
    } finally {
      try {
        await this.dataSource.query('DETACH DATABASE src');
      } catch {
        // DETACH вне транзакции, игнорируем ошибки
      }
    }
  }

  private ensureDir(): void {
    mkdirSync(this.backupDir, { recursive: true });
  }

  private listFiles(): string[] {
    return readdirSync(this.backupDir)
      .filter((f) => BACKUP_NAME_RE.test(f))
      .sort();
  }

  private resolve(name: string): string {
    if (!BACKUP_NAME_RE.test(name)) {
      throw new BadRequestException('Недопустимое имя резервной копии');
    }
    const file = join(this.backupDir, name);
    if (!existsSync(file)) {
      throw new NotFoundException('Резервная копия не найдена');
    }
    return file;
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private formatDateTime(d: Date): string {
    return `${this.formatDate(d)}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  }

  private escapeSqlLiteral(value: string): string {
    return value.replace(/'/g, "''");
  }

  private quoteTable(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}