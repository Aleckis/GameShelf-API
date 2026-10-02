import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListGamesDto } from './dto/list-games.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class GamesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll({ page = 1, limit = 20, search }: ListGamesDto) {
    const where = search
      ? {
          title: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.game.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.game.count({ where }),
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

  async findOne(id: number) {
    const game = await this.prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    return game;
  }

  async computeTop() {
    const grouped = await this.prisma.review.groupBy({
      by: ['gameId'],
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
      having: {
        rating: {
          _count: {
            gte: 3,
          },
        },
      },
      orderBy: [
        { _avg: { rating: 'desc' } },
        { _count: { rating: 'desc' } },
        { gameId: 'asc' },
      ],
      take: 20,
    });

    const games = await this.prisma.game.findMany({
      where: {
        id: {
          in: grouped.map((item) => item.gameId),
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
      },
    });

    const gamesById = new Map(games.map((game) => [game.id, game]));

    return grouped.flatMap((item) => {
      const game = gamesById.get(item.gameId);

      if (!game) {
        return [];
      }

      return [
        {
          ...game,
          averageRating: item._avg.rating,
          reviewCount: item._count.rating,
        },
      ];
    });
  }

  async getTop() {
    const key = 'games:top';

    const cached =
      await this.redis.getJson<Awaited<ReturnType<GamesService['computeTop']>>>(
        key,
      );

    if (cached !== null) {
      return cached;
    }

    const result = await this.computeTop();

    await this.redis.setJson(key, result, 60);

    return result;
  }
}
