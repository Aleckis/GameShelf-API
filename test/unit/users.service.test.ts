import 'reflect-metadata';
import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../../src/users/users.service';
import type { PrismaService } from '../../src/prisma/prisma.service';

describe('UsersService', () => {
  it('transforma duplicidade do Prisma em conflito', async () => {
    const duplicateError = Object.assign(
      new Error('Unique constraint failed'),
      { code: 'P2002' },
    );

    const prisma = {
      user: {
        create: vi.fn().mockRejectedValue(duplicateError),
      },
    };

    const service = new UsersService(
      prisma as unknown as PrismaService,
    );

    await expect(
      service.create({
        email: 'alexandre@example.com',
        username: 'alexandre',
        passwordHash: 'hash-de-teste',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('preserva erros que não são de duplicidade', async () => {
    const connectionError = new Error('Banco indisponível');

    const prisma = {
      user: {
        create: vi.fn().mockRejectedValue(connectionError),
      },
    };

    const service = new UsersService(
      prisma as unknown as PrismaService,
    );

    await expect(
      service.create({
        email: 'alexandre@example.com',
        username: 'alexandre',
        passwordHash: 'hash-de-teste',
      }),
    ).rejects.toBe(connectionError);
  });
});