import { Global, Module } from '@nestjs/common';
import { CacheController } from './cache.controller';
import { RedisCacheService } from './cache.service';

@Global()
@Module({
  imports: [],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
  controllers: [CacheController],
})
export class CacheModule {}
