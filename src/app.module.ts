import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, GamesModule, UsersModule, AuthModule, LibraryModule, ReviewsModule, RedisModule,
    LoggerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    pinoHttp: {
      level: config.get<string>('LOG_LEVEL') ?? 'info',

      genReqId: (_req, res) => {
        const id = randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },

      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'req.body.password',
          'req.body.passwordHash',
        ],
        remove: true,
      },
    },
  }),
}),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
