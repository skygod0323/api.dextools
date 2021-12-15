import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenPairModule } from 'src/tokenpair/tokenpair.module';
import { CronjobService } from './cronjob.service';
import { PairsCronjob } from './entities/pairs_cronjob.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PairsCronjob]), TokenPairModule],
  controllers: [],
  providers: [CronjobService],
  exports: [CronjobService],
})
export class CronjobModule {}
