import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/metrics' || req.path === '/metrics/') {
      return next();
    }

    const startedAt = process.hrtime.bigint();

    res.once('finish', () => {
      const elapsed = process.hrtime.bigint() - startedAt;
      const durationSeconds = Number(elapsed) / 1_000_000_000;

      const routePath: unknown = req.route?.path;

      const route =
        typeof routePath === 'string' &&
        !routePath.includes('*')
          ? routePath
          : 'unmatched';

      this.metricsService.recordRequest(
        req.method,
        route,
        res.statusCode,
        durationSeconds,
      );
    });

    next();
  }
}