import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { SessionData } from '@/modules/auth/types/session';

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
