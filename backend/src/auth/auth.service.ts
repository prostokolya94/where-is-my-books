import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { EventsService } from '../events/events.service';

export interface AuthResult {
  token: string;
  user: {
    id: number;
    login: string;
    fullName: string;
    canDownloadHisOwnDataBase: boolean;
    isAdmin: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly events: EventsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const login = dto.login.trim();
    const existing = await this.userRepo.findOneBy({ login });
    if (existing) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        login,
        passwordHash,
        fullName: dto.fullName.trim(),
        canDownloadHisOwnDataBase: false,
      }),
    );
    this.events.record(user.id, 'auth.register', { login }).catch(() => {});
    return this.buildResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepo.findOneBy({ login: dto.login.trim() });
    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    this.events.record(user.id, 'auth.login', { login: user.login }).catch(() => {});
    return this.buildResult(user);
  }

  async me(userId: number): Promise<AuthResult['user']> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return this.buildResult(user).user;
  }

  private buildResult(user: User): AuthResult {
    const payload = {
      sub: user.id,
      login: user.login,
      fullName: user.fullName,
      canDownloadHisOwnDataBase: user.canDownloadHisOwnDataBase,
      isAdmin: user.isAdmin,
    };
    const token = this.jwtService.sign(payload);
    return {
      token,
      user: {
        id: user.id,
        login: user.login,
        fullName: user.fullName,
        canDownloadHisOwnDataBase: user.canDownloadHisOwnDataBase,
        isAdmin: user.isAdmin,
      },
    };
  }
}