import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BackupsService, BackupInfo } from './backups.service';

@Controller('backups')
export class BackupsController {
  constructor(private readonly service: BackupsService) {}

  @Get()
  list(): BackupInfo[] {
    return this.service.list();
  }

  @Post()
  create() {
    return this.service.create();
  }

  @Delete(':name')
  remove(@Param('name') name: string): BackupInfo[] {
    return this.service.delete(name);
  }

  @Post(':name/apply')
  apply(@Param('name') name: string): Promise<void> {
    return this.service.apply(name);
  }
}