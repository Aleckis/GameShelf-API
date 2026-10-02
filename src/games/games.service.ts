import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListGamesDto } from './dto/list-games.dto';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

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
      orderBy: [
        { title: 'asc' },
        { id: 'asc' },
      ],
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
}