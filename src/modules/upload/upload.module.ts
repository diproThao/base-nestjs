import { Module } from '@nestjs/common';

import { UploadController } from './upload.controller';
import { AwsS3Service } from '../shared/services/aws-s3.service';
import { SharedModule } from '../shared/shared.module';
@Module({
  controllers: [UploadController],
  imports: [SharedModule],
  providers: [AwsS3Service],
})
export class UploadModule {}
