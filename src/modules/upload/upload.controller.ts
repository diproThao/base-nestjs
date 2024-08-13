import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AwsS3Service } from '../shared/services/aws-s3.service';
import { UploadDto } from './dto/UploadDto';

@Controller('upload')
@ApiTags('upload')
export class UploadController {
  constructor(private readonly _s3Service: AwsS3Service) {}

  @Post('/signs3')
  @ApiOperation({ summary: 'Create sign url s3 to upload image' })
  signs3(@Body() body: UploadDto) {
    return this._s3Service.getSignS3Url(body);
  }
}
