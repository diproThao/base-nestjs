import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EBullQueue } from '../common/constants/enum-entity';
import configuration from '../config';
import { TypeOrmConfigService } from '../config/database';
import redisConfiguration from '../config/redis.config';

const QUEUE = [EBullQueue.MAIL];
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration, redisConfiguration],
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: configService.get('redis'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      ...QUEUE.map((queueName) => ({ name: queueName })),
    ),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class FarmerModule {}
