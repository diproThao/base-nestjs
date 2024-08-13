import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard extends NestAuthGuard('jwt') {
  public constructor(private readonly reflector: Reflector) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    // Make sure to check the authorization, for now, just return false to have a difference between public routes.
    const parentCanActivate = (await super.canActivate(context)) as boolean;
    return parentCanActivate;
  }
}
// export const AuthGuard = NestAuthGuard('jwt');
export const AuthGuardOptional = NestAuthGuard(['jwt', 'anonymous']);

@Injectable()
export class OptionalJwtAuthGuard extends NestAuthGuard('jwt') {
  // Override handleRequest so it never throws an error
  handleRequest(err, user) {
    return user;
  }
}
