import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      connectTimeout: 1000,
      commandTimeout: 1000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => 2000,
    });

    this.client.on('ready', () => {
      this.logger.log('Redis conectado');
    });

    this.client.on('error', (error: Error) => {
      this.logger.warn(`Falha no Redis: ${error.message}`);
    });
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);

      if (raw === null) {
        return null;
      }

      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn(`Não foi possível ler o cache: ${key}`);
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      this.logger.warn(`Não foi possível salvar o cache: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      this.logger.warn(`Não foi possível remover o cache: ${key}`);
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
