import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TaskScheduleModule } from './schedule.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(TaskScheduleModule);
  Logger.verbose(`Schedule running`);
}
bootstrap();
