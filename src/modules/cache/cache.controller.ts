import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';

import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Cacheable } from '@type-cacheable/core';
import { IsString } from 'class-validator';
import { Auth } from '../../decorators/auth.decorator';

import { CacheTtlSeconds, RedisCacheService } from './cache.service';

enum CacheKey {
  all = 'all',
  config = 'config',
  userRole = 'userRole',
}
class ClearCacheDto {
  @ApiPropertyOptional({ enum: CacheKey })
  @IsString()
  key: CacheKey;
}
@ApiTags('admin/cache')
@Controller('admin/cache')
export class CacheController {
  constructor(public cacheService: RedisCacheService) {}

  @Delete('/clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear cache by topic',
  })
  @Auth({ checkRole: true })
  async clearCache(@Query() query: ClearCacheDto) {
    return await this.cacheService.clearCacheByTopic(query.key);
  }

  //
  @Get('/test/:id')
  @Cacheable({
    ttlSeconds: CacheTtlSeconds.TEN_SECONDS,
    cacheKey: (args) => `test-id:${args[0]}`,
  })
  async test(@Param('id') id: string) {
    try {
      const value = await this.cacheService.getValue('name');
      console.log('value', value);
    } catch (e) {
      console.log(e);
    }

    console.log(`CacheController::test -> execute args ${id}`);
    return { message: 'CacheController::test' };
  }
}
