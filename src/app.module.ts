import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { GamesModule } from './games/games.module';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, GamesModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
