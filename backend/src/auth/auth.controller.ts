import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService, AuthResult } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ConfirmEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Public } from './public.decorator';
import { CurrentUser, AuthUser } from './current-user.decorator';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.service.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.service.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('confirm-email')
  confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.service.confirmEmail(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.service.forgot(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset')
  reset(@Body() dto: ResetPasswordDto) {
    return this.service.reset(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.service.me(user.id);
  }

  @Post('resend-confirm')
  resendConfirm(@CurrentUser() user: AuthUser) {
    return this.service.resendConfirm(user.id);
  }
}