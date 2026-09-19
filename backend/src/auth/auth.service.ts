import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.entity';
import {
  RegisterDto,
  LoginDto,
  ConfirmEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { EventsService } from '../events/events.service';
import { MailService } from '../mail/mail.service';

export interface AuthResult {
  token: string;
  user: {
    id: number;
    login: string;
    email: string;
    emailConfirmed: boolean;
    fullName: string;
    canDownloadHisOwnDataBase: boolean;
    isAdmin: boolean;
  };
}

const CONFIRM_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly events: EventsService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const login = dto.login.trim();
    const email = dto.email.trim().toLowerCase();
    if (await this.userRepo.findOneBy({ login })) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }
    if (await this.userRepo.findOneBy({ email })) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        login,
        email,
        passwordHash,
        fullName: dto.fullName.trim(),
        canDownloadHisOwnDataBase: false,
        emailConfirmed: false,
      }),
    );
    this.events.record(user.id, 'auth.register', { login }).catch(() => {});
    await this.sendConfirm(user);
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

  async resendConfirm(userId: number): Promise<{ ok: boolean }> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    if (user.emailConfirmed) {
      throw new BadRequestException('Email уже подтверждён');
    }
    if (!user.email) {
      throw new BadRequestException('Email не задан');
    }
    await this.sendConfirm(user);
    this.events
      .record(user.id, 'auth.resendConfirm', { email: user.email })
      .catch(() => {});
    return { ok: true };
  }

  async confirmEmail(dto: ConfirmEmailDto): Promise<{ ok: boolean; email: string }> {
    const hash = this.hashToken(dto.token);
    const user = await this.userRepo.findOneBy({
      emailConfirmToken: hash,
      emailConfirmExpires: MoreThan(new Date()),
    });
    if (!user) {
      throw new BadRequestException('Ссылка недействительна или истекла');
    }
    user.emailConfirmed = true;
    user.emailConfirmToken = null;
    user.emailConfirmExpires = null;
    await this.userRepo.save(user);
    this.events.record(user.id, 'auth.confirm', { email: user.email }).catch(() => {});
    return { ok: true, email: user.email };
  }

  async forgot(dto: ForgotPasswordDto): Promise<{ ok: boolean }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepo.findOneBy({ email });
    if (user?.email) {
      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = this.hashToken(token);
      user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
      await this.userRepo.save(user);
      this.events.record(user.id, 'auth.forgot', { email }).catch(() => {});
      this.mail.sendResetEmail(email, token).catch((e) => {
        this.mailLogger(e instanceof Error ? e.message : String(e));
      });
    }
    return { ok: true };
  }

  async reset(dto: ResetPasswordDto): Promise<{ ok: boolean }> {
    const hash = this.hashToken(dto.token);
    const user = await this.userRepo.findOneBy({
      passwordResetToken: hash,
      passwordResetExpires: MoreThan(new Date()),
    });
    if (!user) {
      throw new BadRequestException('Ссылка недействительна или истекла');
    }
    user.passwordHash = await bcrypt.hash(dto.password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.userRepo.save(user);
    this.events.record(user.id, 'auth.reset', {}).catch(() => {});
    return { ok: true };
  }

  private async sendConfirm(user: User): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    user.emailConfirmToken = this.hashToken(token);
    user.emailConfirmExpires = new Date(Date.now() + CONFIRM_TTL_MS);
    await this.userRepo.save(user);
    this.mail.sendConfirmEmail(user.email, token).catch((e) => {
      this.mailLogger(e instanceof Error ? e.message : String(e));
    });
  }

  private mailLogger(message: string): void {
    // Письмо не ушло — не блокируем регистрацию, логируем в консоль
    console.warn(`[mail] Не удалось отправить письмо: ${message}`);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
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
        email: user.email ?? '',
        emailConfirmed: user.emailConfirmed,
        fullName: user.fullName,
        canDownloadHisOwnDataBase: user.canDownloadHisOwnDataBase,
        isAdmin: user.isAdmin,
      },
    };
  }
}