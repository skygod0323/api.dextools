import { Module } from '@nestjs/common';
import { BitqueryService } from './bitquery.service';

@Module({
  imports: [],
  controllers: [],
  providers: [BitqueryService],
  exports: [BitqueryService],
})
export class ServicesModule {}
