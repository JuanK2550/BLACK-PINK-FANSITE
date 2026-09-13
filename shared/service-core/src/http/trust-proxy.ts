// Proxies de confianza delante del servicio, para que el límite por IP vea al visitante y no al proxy.

import type { INestApplication } from '@nestjs/common';

export type TrustProxySetting = boolean | number | string;

export function parseTrustProxy(value: string | undefined): TrustProxySetting | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw;
}

export function applyTrustProxy(app: INestApplication, value = process.env.TRUST_PROXY): void {
  const setting = parseTrustProxy(value);
  if (setting === undefined) return;

  const server = app.getHttpAdapter().getInstance() as {
    set?: (name: string, value: unknown) => void;
  };
  server.set?.('trust proxy', setting);
}
