import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { GamesService } from '../../src/games/games.service';
import type { PrismaService } from '../../src/prisma/prisma.service';
import type { RedisService } from '../../src/redis/redis.service';

describe('GamesService', () => {
  it('pagina os resultados e calcula o total de páginas', async () => {
    const prisma = {
      game: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      $transaction: vi.fn().mockResolvedValue([
        [{ id: 1, title: 'Jogo de teste' }],
        45,
      ]),
    };

    const service = new GamesService(
      prisma as unknown as PrismaService,
      {} as RedisService,
    );

    const result = await service.findAll({
      page: 2,
      limit: 20,
    });

    expect(prisma.game.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      }),
    );

    expect(result.meta).toEqual({
      page: 2,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });
});
