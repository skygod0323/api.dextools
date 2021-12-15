import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from './telegram/telegram.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as ormConfig from './ormconfig';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ServicesModule } from './services/services.module';
import { TokenPairModule } from './tokenpair/tokenpair.module';
import { SeedModule } from './common/seed/seed.module';
import { CronjobModule } from './cronjob/cronjob.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(ormConfig),
    TelegramModule,
    ScheduleModule.forRoot(),
    ServicesModule,
    TokenPairModule,
    SeedModule,
    CronjobModule
  ],
  controllers: [AppController],
  providers: [AppService, TasksService],
})
export class AppModule {}
