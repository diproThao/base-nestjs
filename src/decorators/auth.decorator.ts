import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { RefreshTokenAuthGuard } from '../guards/refresh-auth.guard';

import { AuthGuard, OptionalJwtAuthGuard } from './../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export const Public = () => SetMetadata('isPublic', true);

export interface AuthOptions {
  checkRole: boolean;
}

export function Auth(option?: AuthOptions) {
  if (option?.checkRole) {
    return applyDecorators(
      // SetMetadata('roles', roles),
      UseGuards(AuthGuard, RolesGuard),
      ApiBearerAuth(),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    );
  }
  return applyDecorators(
    UseGuards(AuthGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

export function AuthRefreshToken() {
  return applyDecorators(
    UseGuards(RefreshTokenAuthGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

export function AuthOptional() {
  return applyDecorators(UseGuards(OptionalJwtAuthGuard));
}
