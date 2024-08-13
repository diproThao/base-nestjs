/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  getRolePermissionCacheKey,
  ACCOUNT_DEACTIVATE,
} from '../common/constants/role.constant';
import { RedisCacheService } from '../modules/cache/cache.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly _reflector: Reflector,
    private readonly _cacheService: RedisCacheService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this._reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    if (process.env.DISABLE_ROLE || isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role === 'bypass') {
      return true;
    }
    const reqMethod = request.method;
    const originalUrl = decodeURIComponent(request.originalUrl);
    // get role permission user on cache
    let roles = null;
    try {
      const redisData =
        (await this._cacheService.getValue(
          getRolePermissionCacheKey(user.id),
        )) ?? 'null';
      roles = JSON.parse(redisData);
    } catch (e) {
      Logger.debug(
        `Can't not Get or Parse data from cache userId: ${user.id}`,
        'RolesGuard',
      );
    }

    if (!roles) {
      Logger.warn("User don't have any permission", 'RolesGuard');
      return false;
    }
    // catch Route wildcards
    const roleCheck = [];
    for (const key of Object.keys(roles)) {
      if (originalUrl.match(key)) {
        roleCheck.push(...roles[key]);
        if (roleCheck.includes('PATCH')) {
          roleCheck.push('PUT');
        } else if (roleCheck.includes('PUT')) {
          roleCheck.push('PATCH');
        }
        break;
      }
    }
    Logger.debug(roleCheck?.includes(reqMethod), 'RolesGuard::canActivate');
    return roleCheck?.includes(reqMethod);
  }
}
