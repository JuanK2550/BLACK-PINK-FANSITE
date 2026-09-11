import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnvelope, Locale } from '@blackpink/types';
import { CacheService } from '@blackpink/service-core';

export interface UpstreamTrack {
  id: string;
  title: string;
  trackNumber: number;
  durationSec: number | null;
  isTitleTrack: boolean;
  localizedTitle: string | null;
  spotifyId: string | null;
  lyricsAvailable: boolean;
  verified: boolean;
}

export interface UpstreamAlbum {
  slug: string;
  title: string;
  releaseDate: string;
  year: number;
  coverUrl: string | null;
  tracks: UpstreamTrack[];
}

export interface UpstreamSoloWork {
  slug: string;
  title: string;
  type: string;
  releaseDate: string;
  coverUrl: string | null;
  durationSec: number | null;
  spotifyId: string | null;
  verified: boolean;
}

export interface UpstreamMember {
  slug: string;
  stageName: string;
  soloWorks: UpstreamSoloWork[];
}

export interface UpstreamTrackDetail extends UpstreamTrack {
  album: { slug: string; title: string; releaseDate: string };
}

/**
 * Cliente de content-service.
 *
 * media-service no toca la base de datos de content-service. Los
 * microservicios que comparten base dejan de ser microservicios: cualquier
 * cambio de esquema rompe a dos duenos a la vez. Se habla por HTTP, por la
 * misma API publica que usa cualquier otro cliente.
 *
 * TRES PROTECCIONES:
 *
 * 1. TIEMPO LIMITE. Sin AbortSignal.timeout, una peticion que se queda colgada
 *    arrastra a media-service con ella: los hilos de espera se acumulan hasta
 *    agotar el servicio. Un fallo aguas arriba tiene que ser rapido.
 *
 * 2. CACHE. Un album se pide una vez y sirve para todas las playlists que lo
 *    contienen. Sin esto, pintar seis playlists son decenas de llamadas al
 *    mismo endpoint.
 *
 * 3. ERROR TRADUCIDO. Un fallo de red aguas arriba sale como 503 con mensaje
 *    propio, nunca propagando el cuerpo del otro servicio: eso filtraria su
 *    estructura interna a traves de este.
 */
@Injectable()
export class ContentClientService {
  private readonly logger = new Logger(ContentClientService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.baseUrl = (config.get<string>('CONTENT_SERVICE_URL') ?? 'http://localhost:4001').replace(
      /\/+$/,
      '',
    );
    this.timeoutMs = Number(config.get<string>('UPSTREAM_TIMEOUT_MS') ?? 4000);
  }

  async getAlbum(slug: string, locale: Locale): Promise<UpstreamAlbum> {
    const { value } = await this.cache.getOrSet(
      this.cache.buildKey('upstream:album', locale, { slug }),
      300,
      () => this.fetchJson<UpstreamAlbum>(`/api/v1/albums/${encodeURIComponent(slug)}`, locale),
    );
    return value;
  }

  async getMember(slug: string, locale: Locale): Promise<UpstreamMember> {
    const { value } = await this.cache.getOrSet(
      this.cache.buildKey('upstream:member', locale, { slug }),
      300,
      () => this.fetchJson<UpstreamMember>(`/api/v1/members/${encodeURIComponent(slug)}`, locale),
    );
    return value;
  }

  async getTrack(id: string, locale: Locale): Promise<UpstreamTrackDetail> {
    const { value } = await this.cache.getOrSet(
      this.cache.buildKey('upstream:track', locale, { id }),
      300,
      () =>
        this.fetchJson<UpstreamTrackDetail>(
          `/api/v1/tracks/${encodeURIComponent(id)}`,
          locale,
          'not-found',
        ),
    );
    return value;
  }

  /** true si content-service responde. Lo usa la comprobacion de salud. */
  async isReachable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * @param missing que significa un 404 aguas arriba para QUIEN pregunta.
   *   'unavailable' -> la referencia la puso este servicio (una playlist
   *      curada): si apunta a algo que ya no existe, el fallo es nuestro y no
   *      del cliente, asi que no se le puede devolver un 404.
   *   'not-found'   -> el identificador lo eligio el cliente: un 404 es la
   *      respuesta correcta y honesta.
   */
  private async fetchJson<T>(
    path: string,
    locale: Locale,
    missing: 'unavailable' | 'not-found' = 'unavailable',
  ): Promise<T> {
    const url = `${this.baseUrl}${path}?locale=${locale}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      this.logger.error(`content-service no responde (${path}): ${describe(error)}`);
      throw new ServiceUnavailableException(
        'El servicio de contenido no esta disponible en este momento.',
      );
    }

    if (response.status === 404) {
      if (missing === 'not-found') {
        throw new NotFoundException('No existe ninguna cancion con ese identificador.');
      }
      throw new ServiceUnavailableException(
        'El contenido referenciado por esta playlist ya no existe.',
      );
    }

    if (!response.ok) {
      this.logger.error(`content-service ha devuelto ${response.status} en ${path}`);
      throw new ServiceUnavailableException(
        'El servicio de contenido ha devuelto una respuesta inesperada.',
      );
    }

    const body = (await response.json()) as ApiEnvelope<T>;
    if (body.data === null) {
      throw new ServiceUnavailableException(
        'El servicio de contenido ha devuelto una respuesta vacia.',
      );
    }

    return body.data;
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
