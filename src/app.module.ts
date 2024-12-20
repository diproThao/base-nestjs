import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import configuration from './config';
import { TypeOrmConfigService } from './config/database';
import { CacheModule } from './modules/cache/cache.module';
import { UploadModule } from './modules/upload/upload.module';
import { BullModule } from '@nestjs/bull';

// import_module_here

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
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
    UploadModule,
    CacheModule,
    // append_here
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
