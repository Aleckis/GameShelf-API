import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}