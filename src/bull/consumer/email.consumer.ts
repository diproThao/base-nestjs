import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AwsSESService } from '../../modules/shared/services/aws-ses.service';
import { EBullQueue, EBullJob } from 'src/common/constants/enum-entity';
@Processor(EBullQueue.MAIL)
export class EmailConsumer {
  constructor(private readonly _sesService: AwsSESService) {}

  @Process(EBullJob.SEND_EMAIL)
  async readOperationJob(job: Job<any>) {
    console.log(job);
  }
}
