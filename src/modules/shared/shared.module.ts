import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsS3Service } from './services/aws-s3.service';
import { GeneratorService } from './services/generator.service';

const providers = [AwsS3Service, GeneratorService];

@Global()
@Module({
  providers,
  imports: [ConfigModule],
  exports: [...providers],
})
export class SharedModule {}
