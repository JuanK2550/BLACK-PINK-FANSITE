// Cliente para pedir canciones a content-service.

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
