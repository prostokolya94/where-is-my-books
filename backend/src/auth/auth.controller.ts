import { Body, Controller, Get, Post } from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.service.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.service.login(dto);
  }

  @Public()
  @Post('confirm-email')
  confirmEmail(@Body() dto: ConfirmEmailDto) {
    return this.service.confirmEmail(dto);
  }

  @Public()
  @Post('forgot')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.service.forgot(dto);
  }

  @Public()
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