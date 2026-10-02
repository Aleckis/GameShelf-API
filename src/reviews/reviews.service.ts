import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(userId: string, gameId: number, dto: CreateReviewDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });

    if (!game) {
      throw new NotFoundException('Jogo não encontrado');
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          userId,
          gameId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      await this.redis.del('games:top');

      return review;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Você já avaliou este jogo');
      }

      throw error;
    }
  }

  async findAll(gameId: number, { page = 1, limit = 20 }: ListReviewsDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });

    if (!game) {
      throw new NotFoundException('Jogo não encontrado');
    }

    const where = { gameId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(userId: string, reviewId: number, dto: UpdateReviewDto) {
    if (dto.rating === undefined && dto.comment === undefined) {
      throw new BadRequestException('Informe uma nota ou um comentário');
    }

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Você não pode editar esta avaliação');
    }

    try {
      const updatedReview = await this.prisma.review.update({
        where: { id: reviewId },
        data: {
          ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
          ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
        },
      });

      await this.redis.del('games:top');

      return updatedReview;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException('Avaliação não encontrada');
      }

      throw error;
    }
  }

  async remove(userId: string, reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('Você não pode remover esta avaliação');
    }

    try {
      await this.prisma.review.delete({
        where: { id: reviewId },
      });

      await this.redis.del('games:top');
      
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException('Avaliação não encontrada');
      }

      throw error;
    }
  }
}
