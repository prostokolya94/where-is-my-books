import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { DumpsService, DumpInfo } from './dumps.service';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Track } from '../events/event-track.decorator';

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

@Controller('dumps')
export class DumpsController {
  constructor(private readonly service: DumpsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<DumpInfo[]> {
    return this.service.list(user.id);
  }

  @Post()
  @Track('dump.create')
  create(@CurrentUser() user: AuthUser): Promise<DumpInfo[]> {
    return this.service.create(user.id, user.login);
  }

  @Get(':id/download')
  @Track('dump.download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { data, name } = await this.service.download(user, +id);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${name.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    );
    return new StreamableFile(data);
  }

  @Post('upload')
  @Track('dump.upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_SIZE },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
  ): Promise<DumpInfo[]> {
    return this.service.upload(user, {
      originalname: file?.originalname ?? '',
      size: file?.size ?? 0,
      buffer: file?.buffer ?? Buffer.alloc(0),
    });
  }

  @Post(':id/apply')
  @Track('dump.apply')
  apply(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.service.apply(user.id, +id);
  }

  @Delete(':id')
  @Track('dump.delete')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<DumpInfo[]> {
    return this.service.remove(user.id, +id);
  }
}