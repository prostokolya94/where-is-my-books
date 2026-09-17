import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface AuthUser {
  id: number;
  login: string;
  fullName: string;
  canDownloadHisOwnDataBase: boolean;
  isAdmin: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('Не авторизован');
    }
    return request.user as AuthUser;
  },
);