import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';

export interface AdminUserView {
  id: number;
  login: string;
  fullName: string;
  isAdmin: boolean;
  canDownloadHisOwnDataBase: boolean;
  createdAt: Date;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async list(): Promise<AdminUserView[]> {
    const users = await this.userRepo.find({
      select: [
        'id',
        'login',
        'fullName',
        'isAdmin',
        'canDownloadHisOwnDataBase',
        'createdAt',
      ],
      order: { id: 'ASC' },
    });
    return users;
  }

  async update(
    id: number,
    dto: { isAdmin?: boolean; canDownloadHisOwnDataBase?: boolean },
    actorId: number,
  ): Promise<AdminUserView> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    if (
      user.id === actorId &&
      dto.isAdmin === false
    ) {
      throw new BadRequestException('Нельзя снять права администратора с себя');
    }
    if (typeof dto.isAdmin === 'boolean') {
      user.isAdmin = dto.isAdmin;
    }
    if (typeof dto.canDownloadHisOwnDataBase === 'boolean') {
      user.canDownloadHisOwnDataBase = dto.canDownloadHisOwnDataBase;
    }
    await this.userRepo.save(user);
    return {
      id: user.id,
      login: user.login,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
      canDownloadHisOwnDataBase: user.canDownloadHisOwnDataBase,
      createdAt: user.createdAt,
    };
  }
}