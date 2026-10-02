import { randomUUID, randomInt } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';

describe('Autenticação e2e', () => {
  let app: INestApplication | undefined;
  let prisma: PrismaService;
  const suffix = randomUUID();
  const emailA = `a-${suffix}@example.com`;
  const emailB = `b-${suffix}@example.com`;

  let gameId: number | undefined;

  const email = `e2e-${suffix}@example.com`;
  const username = `e2e_${suffix.replaceAll('-', '').slice(0, 20)}`;
  const password = 'SenhaTeste123!';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue({
        getJson: vi.fn().mockResolvedValue(null),
        setJson: vi.fn().mockResolvedValue(undefined),
        del: vi.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (!app) {
      return;
    }

    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [email, emailA, emailB],
          },
        },
      });

      if (gameId !== undefined) {
        await prisma.game.deleteMany({
          where: { id: gameId },
        });
      }
    } finally {
      await app.close();
    }
  });

  it('cadastra, autentica e protege o acesso', async () => {
    const server = app!.getHttpServer();

    const registration = await request(server)
      .post('/auth/register')
      .send({ email, username, password })
      .expect(201);

    expect(registration.body).not.toHaveProperty('password');
    expect(registration.body).not.toHaveProperty('passwordHash');

    await request(server)
      .post('/auth/register')
      .send({ email, username, password })
      .expect(409);

    await request(server)
      .post('/auth/login')
      .send({ email, password: 'SenhaErrada123!' })
      .expect(401);

    const login = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(login.body.accessToken).toEqual(expect.any(String));

    const profile = await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(profile.body.id).toBe(registration.body.id);

    await request(server).get('/auth/me').expect(401);

    await request(server)
      .get('/auth/me')
      .set('Authorization', 'Bearer abc')
      .expect(401);
  });

  it('isola bibliotecas e protege avaliações de outros usuários', async () => {
  const server = app!.getHttpServer();

  const game = await prisma.game.create({
    data: {
      externalId: -randomInt(1, 2_000_000_000),
      title: 'Jogo para teste e2e',
      slug: `e2e-${suffix}`,
      genres: [],
      platforms: [],
    },
  });

  gameId = game.id;

  const tokens: string[] = [];

  for (const [index, accountEmail] of [emailA, emailB].entries()) {
    await request(server)
      .post('/auth/register')
      .send({
        email: accountEmail,
        username: `e2e_${index}_${suffix.replaceAll('-', '').slice(0, 16)}`,
        password,
      })
      .expect(201);

    const login = await request(server)
      .post('/auth/login')
      .send({ email: accountEmail, password })
      .expect(200);

    tokens.push(login.body.accessToken);
  }

  const authA = `Bearer ${tokens[0]}`;
  const authB = `Bearer ${tokens[1]}`;

  await request(server)
    .post('/me/library')
    .set('Authorization', authA)
    .send({ gameId, status: 'PLAYING' })
    .expect(201);

  await request(server)
    .post('/me/library')
    .set('Authorization', authA)
    .send({ gameId })
    .expect(409);

  const libraryB = await request(server)
    .get('/me/library')
    .set('Authorization', authB)
    .expect(200);

  expect(libraryB.body.items).toEqual([]);
  expect(libraryB.body.meta.total).toBe(0);

  await request(server)
    .patch(`/me/library/${gameId}`)
    .set('Authorization', authB)
    .send({ hoursPlayed: 10 })
    .expect(404);

  const updatedEntry = await request(server)
    .patch(`/me/library/${gameId}`)
    .set('Authorization', authA)
    .send({ hoursPlayed: 0 })
    .expect(200);

  expect(updatedEntry.body.hoursPlayed).toBe(0);
  expect(updatedEntry.body.status).toBe('PLAYING');

  const createdReview = await request(server)
    .post(`/games/${gameId}/reviews`)
    .set('Authorization', authA)
    .send({ rating: 9, comment: 'Comentário de teste' })
    .expect(201);

  const reviewId = createdReview.body.id;

  await request(server)
    .post(`/games/${gameId}/reviews`)
    .set('Authorization', authA)
    .send({ rating: 8 })
    .expect(409);

  await request(server)
    .patch(`/reviews/${reviewId}`)
    .set('Authorization', authB)
    .send({ rating: 1 })
    .expect(403);

  await request(server)
    .delete(`/reviews/${reviewId}`)
    .set('Authorization', authB)
    .expect(403);

  const publicReviews = await request(server)
    .get(`/games/${gameId}/reviews`)
    .expect(200);

  expect(publicReviews.body.items).toHaveLength(1);
  expect(publicReviews.body.items[0].rating).toBe(9);
  expect(publicReviews.body.items[0].user).not.toHaveProperty('passwordHash');
  expect(publicReviews.body.items[0].user).not.toHaveProperty('email');

  await request(server)
    .delete(`/reviews/${reviewId}`)
    .set('Authorization', authA)
    .expect(204);

  await request(server)
    .delete(`/reviews/${reviewId}`)
    .set('Authorization', authA)
    .expect(404);

  await request(server)
    .delete(`/me/library/${gameId}`)
    .set('Authorization', authA)
    .expect(204);
});

});
