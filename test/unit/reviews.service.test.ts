import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ReviewsService } from '../../src/reviews/reviews.service';
import type { PrismaService } from '../../src/prisma/prisma.service';
import type { RedisService } from '../../src/redis/redis.service';

describe('ReviewsService', () => {
  it('impede editar a avaliação de outro usuário', async () => {
    const prisma = {
      review: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          userId: 'usuario-dono',
        }),
        update: vi.fn(),
      },
    };

    const redis = {
      del: vi.fn(),
    };

    const service = new ReviewsService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
    );

    await expect(
      service.update('outro-usuario', 1, { rating: 8 }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.review.update).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
  });
});