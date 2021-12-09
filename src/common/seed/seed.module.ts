import { Module } from '@nestjs/common';
import { TokenPairModule } from 'src/tokenpair/tokenpair.module';
import { SeedService } from './seed.service';

@Module({
  imports: [TokenPairModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
