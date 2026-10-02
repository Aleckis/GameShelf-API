import 'reflect-metadata';
import { config } from 'dotenv';

const loaded = config({
  path: '.env.test',
  override: true,
});

if (loaded.error) {
  throw new Error('Não foi possível carregar .env.test');
}

const url = new URL(process.env.DATABASE_URL ?? '');

if (
  !['localhost', '127.0.0.1'].includes(url.hostname) ||
  url.port !== '5433' ||
  url.pathname !== '/gameshelf_test'
) {
  throw new Error('Os testes exigem gameshelf_test na porta 5433');
}