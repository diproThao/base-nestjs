import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AppController } from './app.controller';
import configuration from './config';
import { CacheModule } from './modules/cache/cache.module';
import { UploadModule } from './modules/upload/upload.module';

// import_module_here

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.url'),
        entities:
          process.env.NODE_ENV !== 'production'
            ? [join(__dirname, '/entities/**', '*.{ts,js}')]
            : ['dist/entities/*.entity{.ts,.js}'],
        logging: true,
        namingStrategy: new SnakeNamingStrategy(),
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
