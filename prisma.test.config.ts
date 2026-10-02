import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const loaded = config({
  path: '.env.test',
  override: true,
});

if (loaded.error) {
  throw new Error('Não foi possível carregar .env.test');
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL ausente em .env.test');
}

const url = new URL(databaseUrl);

if (
  !['localhost', '127.0.0.1'].includes(url.hostname) ||
  url.port !== '5433' ||
  url.pathname !== '/gameshelf_test'
) {
  throw new Error(
    'Use o banco gameshelf_test local na porta 5433',
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});