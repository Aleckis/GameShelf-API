import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;
    const parts = authorization?.split(' ');

    if (
      parts?.length !== 2 ||
      parts[0] !== 'Bearer' ||
      !parts[1]
    ) {
      throw new UnauthorizedException('Token ausente ou inválido');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub?: unknown;
      }>(parts[1], {
        algorithms: ['HS256'],
      });

      if (
        typeof payload.sub !== 'string' ||
        payload.sub.length === 0
      ) {
        throw new UnauthorizedException('Token inválido');
      }

      request.user = { id: payload.sub };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    return true;
  }
}