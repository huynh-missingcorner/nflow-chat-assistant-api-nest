import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionData } from '@/modules/auth/types/session';
import { Request } from 'express';

export const AuthenticatedUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const session = request.session as SessionData;

  if (!session.userId) {
    throw new UnauthorizedException('User not authenticated');
  }

  return {
    userId: session.userId,
    userInfo: session.userInfo,
  };
});
