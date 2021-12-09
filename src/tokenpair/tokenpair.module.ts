import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServicesModule } from 'src/services/services.module';
import { TokenPair } from './entities/tokenpair.entity';
import { TokenPairController } from './tokenpair.controller';
import { TokenPairService } from './tokenpair.service';

@Module({
  imports: [TypeOrmModule.forFeature([TokenPair]), ServicesModule],
  controllers: [TokenPairController],
  providers: [TokenPairService],
  exports: [TokenPairService],
})
export class TokenPairModule {}
