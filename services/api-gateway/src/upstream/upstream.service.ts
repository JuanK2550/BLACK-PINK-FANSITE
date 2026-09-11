import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@blackpink/service-core';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

export type UpstreamName = 'content' | 'media';

export interface UpstreamResponse {
  status: number;
  body: unknown;
  /** true si el cuerpo salio de la cache y no del servicio. */
  cached: boolean;
  /** true si se sirvio cache caducada porque el servicio no responde. */
  stale: boolean;
}

interface UpstreamTarget {
  name: UpstreamName;
  baseUrl: string;
  breaker: CircuitBreaker;
}

/** Cuerpo cacheado junto al momento en que se guardo. */
interface CachedEntry {
  status: number;
  body: unknown;
  storedAt: number;
}

/** Codigos que NO se reintentan: el problema es la peticion, no la red. */
const NON_RETRYABLE = new Set([400, 401, 403, 404, 409, 422]);

@Injectable()
export class UpstreamService {
  private readonly logger = new Logger(UpstreamService.name);
  private readonly targets: Record<UpstreamName, UpstreamTarget>;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly staleTtl: number;

  constructor(
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    const clean = (url: string) => url.replace(/\/+$/, '');

    this.targets = {
      content: {
        name: 'content',
        baseUrl: clean(config.get<string>('CONTENT_SERVICE_URL') ?? 'http://localhost:4001'),
        breaker: new CircuitBreaker('content-service'),
      },
      media: {
        name: 'media',
        baseUrl: clean(config.get<string>('MEDIA_SERVICE_URL') ?? 'http://localhost:4002'),
        breaker: new CircuitBreaker('media-service'),
      },
    };

    this.timeoutMs = Number(config.get<string>('UPSTREAM_TIMEOUT_MS') ?? 4000);
    this.retries = Number(config.get<string>('UPSTREAM_RETRIES') ?? 2);
    // La copia de respaldo vive MUCHO mas que la cache normal: solo se usa
    // cuando el servicio esta caido, y entonces un dato viejo vale mas que un
    // error. Ver `stale` en la respuesta: el cliente sabe que lo es.
    this.staleTtl = Number(config.get<string>('UPSTREAM_STALE_TTL_SECONDS') ?? 86_400);
  }

  /**
   * Reenvia una peticion GET a un servicio, con cache, reintentos e
   * interruptor. Devuelve el cuerpo tal cual: el gateway no reinterpreta el
   * envelope del servicio, solo lo transporta.
   */
  async get(
    upstream: UpstreamName,
    path: string,
    query: string,
    ttlSeconds: number,
    locale: string | undefined,
  ): Promise<UpstreamResponse> {
    const target = this.targets[upstream];
    const key = this.cache.buildKey(`proxy:${upstream}`, locale, { path, query });

    const hit = await this.cache.get<CachedEntry>(key);
    if (hit) {
      return { status: hit.status, body: hit.body, cached: true, stale: false };
    }

    const url = `${target.baseUrl}${path}${query ? `?${query}` : ''}`;

    try {
      const result = await target.breaker.run(() => this.fetchWithRetries(url, target.name));

      // Solo se cachea lo que salio bien. Cachear un 404 haria que un dato
      // recien publicado siguiera sin verse durante todo el TTL.
      if (result.status < 400) {
        const entry: CachedEntry = { ...result, storedAt: Date.now() };
        await this.cache.set(key, entry, ttlSeconds);
        await this.cache.set(this.staleKey(key), entry, this.staleTtl);
      }

      return { ...result, cached: false, stale: false };
    } catch (error) {
      return this.serveStaleOrFail(key, target.name, error);
    }
  }

  /**
   * Ultimo recurso: si hay una copia de respaldo, se sirve marcada como
   * obsoleta. Una pagina con datos de ayer es mejor que una pagina rota, y
   * marcarlo permite al cliente avisar al visitante.
   */
  private async serveStaleOrFail(
    key: string,
    name: UpstreamName,
    error: unknown,
  ): Promise<UpstreamResponse> {
    const stale = await this.cache.get<CachedEntry>(this.staleKey(key));

    if (stale) {
      const ageMinutes = Math.round((Date.now() - stale.storedAt) / 60_000);
      this.logger.warn(
        `${name}-service no responde; se sirve una copia de hace ${ageMinutes} min.`,
      );
      return { status: stale.status, body: stale.body, cached: true, stale: true };
    }

    if (error instanceof CircuitOpenError) {
      this.logger.warn(`${name}-service: circuito abierto y sin copia de respaldo.`);
    } else {
      this.logger.error(`${name}-service no responde: ${describe(error)}`);
    }

    throw new ServiceUnavailableException(
      'Un servicio del que depende esta peticion no esta disponible.',
    );
  }

  private staleKey(key: string): string {
    return `${key}:stale`;
  }

  /**
   * Reintenta con espera exponencial y una pizca de aleatoriedad.
   *
   * El "jitter" no es cosmetico: sin el, todos los clientes que fallaron a la
   * vez reintentan a la vez y rematan al servicio que intentaba levantarse.
   */
  private async fetchWithRetries(
    url: string,
    name: UpstreamName,
  ): Promise<{ status: number; body: unknown }> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        const body: unknown = await response.json().catch(() => null);

        // Un 4xx es una respuesta valida del servicio: se transporta tal cual
        // y no cuenta como fallo del circuito. Reintentar un 404 solo gasta
        // tiempo y lo convierte en un 503 que confunde al cliente.
        if (NON_RETRYABLE.has(response.status)) {
          return { status: response.status, body };
        }

        if (response.ok) {
          return { status: response.status, body };
        }

        lastError = new Error(`${name}-service ha devuelto ${response.status}`);
      } catch (error) {
        lastError = error;
      }

      if (attempt < this.retries) {
        await delay(2 ** attempt * 100 + Math.random() * 100);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  /** ¿Responde el servicio? Lo usa la comprobacion de salud agregada. */
  async probe(upstream: UpstreamName): Promise<{ up: boolean; latencyMs: number | null }> {
    const target = this.targets[upstream];
    const startedAt = Date.now();

    try {
      const response = await fetch(`${target.baseUrl}/health`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      return { up: response.ok, latencyMs: Date.now() - startedAt };
    } catch {
      return { up: false, latencyMs: null };
    }
  }

  breakerState(upstream: UpstreamName) {
    return this.targets[upstream].breaker.snapshot();
  }

  baseUrlOf(upstream: UpstreamName): string {
    return this.targets[upstream].baseUrl;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
