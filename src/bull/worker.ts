import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FarmerModule } from './farmer.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(FarmerModule);
  Logger.verbose(`Farmer running`);
}
bootstrap();
