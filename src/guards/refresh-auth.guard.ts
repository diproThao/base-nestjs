import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RefreshTokenAuthGuard extends NestAuthGuard('rf-token') {
  public constructor(private readonly reflector: Reflector) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Make sure to check the authorization, for now, just return false to have a difference between public routes.
    const parentCanActivate = (await super.canActivate(context)) as boolean;
    return parentCanActivate;
  }
}
