import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { Setting } from './entities/setting.entity';
import { Bot } from './entities/bot.entity';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, Bot]), ServicesModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
