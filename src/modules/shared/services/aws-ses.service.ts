import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import mailcomposer from 'mailcomposer';
import { IAwsConfig } from '../../../common/IAwsConfig';

const API_VERSION = '2010-12-01';
const UTF_8 = 'UTF-8';

@Injectable()
export class AwsSESService {
  private readonly _ses: AWS.SES;

  constructor(private readonly configService: ConfigService) {
    const awsIAMConfig = configService.get<IAwsConfig>('aws');
    const options: AWS.SES.Types.ClientConfiguration = {
      apiVersion: API_VERSION,
      ...awsIAMConfig,
    };

    this._ses = new AWS.SES(options);
  }

  async sendEmail(
    subject: string,
    sender: string,
    body: string,
    ...toAddresses: string[]
  ) {
    const params = {
      Destination: {
        ToAddresses: toAddresses, // email người nhận
      },
      Source: sender, // email dùng để gửi đi
      Message: {
        Subject: {
          Data: subject,
          Charset: UTF_8,
        },
        Body: {
          Html: {
            Charset: UTF_8,
            Data: body,
          },
          Text: {
            Charset: UTF_8,
            Data: body,
          },
        },
      },
    };

    return this._ses.sendEmail(params).promise();
  }

  async sendEmailWithAttachment(
    file,
    subject: string,
    sender: string,
    body: string,
    toAddresses: string,
  ) {
    let sendRawEmailPromise;

    const mail = mailcomposer({
      from: sender,
      to: toAddresses,
      subject: subject,
      text: body,
      attachments: [
        {
          fileName: 'duck.xlsx',
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          content: file.buffer,
        },
      ],
    });
    mail.build((err, message) => {
      if (err) {
        return `Error sending raw email: ${err}`;
      }
      sendRawEmailPromise = this._ses
        .sendRawEmail({ RawMessage: { Data: message } })
        .promise();
    });
    return sendRawEmailPromise;
  }
}
