import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('*/15 * * * * *')
  handleCron() {
    // this.logger.debug('Called every 15 second');
  }
}
