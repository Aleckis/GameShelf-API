import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  Get,
  Query,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';
import { ListReviewsDto } from './dto/list-reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('games/:gameId/reviews')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: { id: string },
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, gameId, dto);
  }

  @Get('games/:gameId/reviews')
  findAll(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Query() query: ListReviewsDto,
  ) {
    return this.reviewsService.findAll(gameId, query);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: { id: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(user.id, id, dto);
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.reviewsService.remove(user.id, id);
  }
}
