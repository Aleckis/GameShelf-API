import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { GamesModule } from './games/games.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LibraryModule } from './library/library.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RedisModule } from './redis/redis.module';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, GamesModule, UsersModule, AuthModule, LibraryModule, ReviewsModule, RedisModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
