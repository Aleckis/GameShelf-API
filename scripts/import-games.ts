import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { z } from 'zod';
import { setTimeout as delay } from 'node:timers/promises';

const rawgGameSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  slug: z.string().min(1),
  released: z.string().nullable().optional(),
  background_image: z.string().nullable().optional(),
  genres: z
    .array(
      z.object({
        name: z.string(),
      }),
    )
    .nullish(),
  platforms: z
    .array(
      z.object({
        platform: z.object({
          name: z.string(),
        }),
      }),
    )
    .nullish(),
});

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const apiKey = process.env.RAWG_API_KEY;

  if (!databaseUrl || !apiKey) {
    throw new Error('Configure DATABASE_URL e RAWG_API_KEY no .env');
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();

    for (let page = 1; page <= 3; page++) {

    const url = new URL('https://api.rawg.io/api/games');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', '20');

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`A RAWG respondeu com status ${response.status}`);
    }

    const data: unknown = await response.json();

    if (
      typeof data !== 'object' ||
      data === null ||
      !('results' in data) ||
      !Array.isArray(data.results)
    ) {
      throw new Error('Formato inesperado na resposta da RAWG');
    }

    const games = data.results.map((game) => rawgGameSchema.parse(game));

    for (const game of games) {
      const released = game.released ? new Date(game.released) : null;

      if (released && Number.isNaN(released.getTime())) {
        throw new Error('Data de lançamento inválida');
      }

      const gameData = {
        title: game.name,
        slug: game.slug,
        released,
        coverUrl: game.background_image ?? null,
        genres: (game.genres ?? []).map((genre) => genre.name),
        platforms: (game.platforms ?? []).map((item) => item.platform.name),
      };

      await prisma.game.upsert({
        where: {
          externalId: game.id,
        },
        update: gameData,
        create: {
          externalId: game.id,
          ...gameData,
        },
      });

      console.log(`Sincronizado: ${game.name}`);
    }
    
    console.log(
  `Página ${page} concluída: ${games.length} jogos`,
);

if (
  games.length === 0 ||
  ('next' in data && data.next === null)
) {
  break;
}

if (page < 3) {
  await delay(1000);
}
}

    

console.log('Importação concluída');

  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof z.ZodError) {
    console.error(
      'A RAWG retornou campos incompatíveis com o formato esperado',
    );
  } else if (
    error instanceof Error &&
    error.name === 'TimeoutError'
  ) {
    console.error('A RAWG não respondeu em até 10 segundos');
  } else if (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    console.error(`Falha na importação. Código: ${error.code}`);
  } else {
    console.error(
      'Importação interrompida. Confira conexão, chave e resposta da RAWG',
    );
  }

  process.exitCode = 1;
});