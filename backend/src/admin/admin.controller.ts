import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AdminService, AdminUserView } from './admin.service';
import { AdminGuard } from './admin.guard';
import { UpdateUserAdminDto } from './admin.dto';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('users')
  list(): Promise<AdminUserView[]> {
    return this.service.list();
  }

  @Patch('users/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAdminDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<AdminUserView> {
    return this.service.update(id, dto, actor.id);
  }
}