import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import mime from 'mime-types';

import configuration from '../../../config';
import { IAwsConfig } from '../../../common/IAwsConfig';
import { IFile } from '../../../common/IFile';
import { GeneratorService } from './generator.service';

@Injectable()
export class AwsS3Service {
  private readonly _s3: AWS.S3;

  constructor(
    public configService: ConfigService,
    public generatorService: GeneratorService,
  ) {
    const options: AWS.S3.Types.ClientConfiguration = {
      region: configuration().aws.region,
      signatureVersion: 'v4',
    };

    const awsS3Config = configService.get<IAwsConfig>('aws');
    if (awsS3Config.accessKeyId && awsS3Config.secretAccessKey) {
      options.credentials = awsS3Config;
    }

    this._s3 = new AWS.S3(options);
  }

  async uploadImage(file: IFile) {
    const fileName = this.generatorService.fileName(
      <string>mime.extension(file.mimetype),
    );
    const key = 'images/' + fileName;
    await this._s3
      .putObject({
        Bucket: this.configService.get<string>('aws.bucket'),
        Body: file.buffer,
        ACL: 'public-read',
        Key: key,
      })
      .promise();

    return key;
  }

  getFileLocation(key: string) {
    return key;
  }

  getSignS3Url(body) {
    let key = this.generatorService.getFileName(body.name);
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    key = `${body.folder}/${key}`;
    const s3Params = {
      Bucket: this.configService.get<string>('aws.bucket'),
      Key: key,
      ACL: 'public-read',
      ContentType: body.type,
    };

    // Ask S3 for a temporary URL that the clfolderient can use.
    const uploadUrl = this._s3.getSignedUrl('putObject', s3Params);
    return {
      uploadUrl,
      name: key,
      url: this.getFileLocation(key),
    };
  }

  async uploadBuffer(buffer, name) {
    const s3UploadConfig: AWS.S3.Types.PutObjectRequest = {
      ACL: 'public-read', // OR maybe "bucket-owner-full-control"
      Body: buffer,
      Bucket: this.configService.get<string>('aws.bucket'),
      ContentType: 'image/png',
      Key: name,
    };

    return this._s3.putObject(s3UploadConfig).promise();
  }
}
