import { describe, expect, it, vi } from 'vitest';
import type { CacheService } from '@blackpink/service-core';
import type { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

function controllerWith(databaseUp: boolean, cacheUp = true) {
  const prisma = { isReachable: vi.fn().mockResolvedValue(databaseUp) } as unknown as PrismaService;
  const cache = { isReachable: vi.fn().mockResolvedValue(cacheUp) } as unknown as CacheService;
  return new HealthController(prisma, cache);
}

describe('HealthController (content-service)', () => {
  it('mantiene el contrato de salud compartido por los cinco servicios', () => {
    expect(controllerWith(true).check()).toEqual({ status: 'ok', service: 'content-service' });
  });

  it('informa de que la base responde', async () => {
    await expect(controllerWith(true).checkDatabase()).resolves.toEqual({
      status: 'ok',
      service: 'content-service',
      database: 'up',
    });
  });

  it('marca el servicio como degradado cuando la base no responde', async () => {
    await expect(controllerWith(false).checkDatabase()).resolves.toEqual({
      status: 'degraded',
      service: 'content-service',
      database: 'down',
    });
  });

  it('sigue estando ok con la cache caida: puede servir desde la base', async () => {
    const result = await controllerWith(true, false).checkDependencies();
    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
  });
});
