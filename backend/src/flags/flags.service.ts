import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppFlag } from './flag.entity';
import { FLAG_DEFS, isKnownFlag } from './flags.constants';
import { EventsService } from '../events/events.service';

@Injectable()
export class FlagsService implements OnModuleInit {
  constructor(
    @InjectRepository(AppFlag)
    private readonly repo: Repository<AppFlag>,
    private readonly events: EventsService,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const def of FLAG_DEFS) {
      const exists = await this.repo.findOneBy({ name: def.key });
      if (!exists) {
        await this.repo.save(
          this.repo.create({ name: def.key, label: def.label, enabled: true }),
        );
      }
    }
  }

  async list(): Promise<AppFlag[]> {
    const known = new Set(FLAG_DEFS.map((def) => def.key));
    const flags = await this.repo.find();
    const views: AppFlag[] = [];
    for (const def of FLAG_DEFS) {
      const flag = flags.find((item) => item.name === def.key);
      views.push(
        flag
          ? flag
          : this.repo.create({
              name: def.key,
              label: def.label,
              enabled: true,
            }),
      );
    }
    const stale = flags.filter((item) => !known.has(item.name));
    views.push(...stale);
    return views;
  }

  async set(name: string, enabled: boolean, actorId: number): Promise<AppFlag> {
    const flag = await this.repo.findOneBy({ name });
    if (!flag) {
      if (!isKnownFlag(name)) {
        throw new NotFoundException(`Неизвестный флаг "${name}"`);
      }
      throw new NotFoundException(`Флаг "${name}" ещё не создан`);
    }
    flag.enabled = enabled;
    await this.repo.save(flag);
    await this.events.record(actorId, 'admin.setFlag', { name, enabled });
    return flag;
  }
}