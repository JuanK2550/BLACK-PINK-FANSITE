// Lee el contenido publicado del sitio y lo convierte en texto para PINKY.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Locale } from '@blackpink/types';

export interface SourceItem {
  key: string;
  sourceLabel: string;
  sourcePath: string;
  text: string;
}

interface Envelope<T> {
  data: T;
}

const LABELS: Record<Locale, Record<string, string>> = {
  es: {
    member: 'Ficha de {name}',
    solo: 'Trabajo en solitario de {name}',
    soloWork: '{name}',
    memberTrivia: 'Curiosidades sobre {name}',
    album: 'Ficha de {name}',
    timeline: 'Cronologia',
    trivia: 'Curiosidades',
    awards: 'Premios',
  },
  en: {
    member: '{name} profile',
    solo: '{name} solo work',
    soloWork: '{name}',
    memberTrivia: 'Fun facts about {name}',
    album: '{name} album page',
    timeline: 'Timeline',
    trivia: 'Fun facts',
    awards: 'Awards',
  },
  ko: {
    member: '{name} 프로필',
    solo: '{name} 솔로 활동',
    soloWork: '{name}',
    memberTrivia: '{name} 비하인드',
    album: '{name} 앨범 페이지',
    timeline: '연표',
    trivia: '비하인드',
    awards: '수상',
  },
};

const label = (locale: Locale, key: string, name = ''): string =>
  (LABELS[locale][key] ?? key).replace('{name}', name);

@Injectable()
export class ContentSourceService {
  private readonly logger = new Logger(ContentSourceService.name);
  private readonly baseUrl: string;
  private readonly internalKey: string;
  private readonly failures = new Map<Locale, string[]>();

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('CONTENT_SERVICE_URL')?.trim() || 'http://localhost:4001'
    ).replace(/\/+$/, '');
    this.internalKey = config.get<string>('INTERNAL_API_KEY')?.trim() ?? '';
  }

  async collect(locale: Locale): Promise<SourceItem[]> {
    return (await this.collectWithReport(locale)).items;
  }

  async collectWithReport(locale: Locale): Promise<{ items: SourceItem[]; failed: string[] }> {
    const failed: string[] = [];
    this.failures.set(locale, failed);

    const parts = await Promise.all([
      this.members(locale),
      this.albums(locale),
      this.timeline(locale),
      this.trivia(locale),
      this.awards(locale),
    ]);

    return { items: parts.flat(), failed: [...failed] };
  }

  private async members(locale: Locale): Promise<SourceItem[]> {
    const list = await this.get<{ slug: string }[]>(`/api/v1/members`, locale);
    if (!list) return [];

    const items: SourceItem[] = [];

    for (const summary of list) {
      const member = await this.get<{
        slug: string;
        stageName: string;
        fullName: string | null;
        position: string | null;
        nationality: string | null;
        birthDate: string | null;
        bio: string | null;
        soloWorks: {
          slug: string;
          title: string;
          releaseDate: string;
          formatLabel: string | null;
          description: string | null;
          tracks: {
            title: string;
            trackNumber: number;
            isTitleTrack: boolean;
            featuring: string | null;
          }[];
        }[];
        trivia: { content: string }[];
      }>(`/api/v1/members/${encodeURIComponent(summary.slug)}`, locale);

      if (!member) continue;

      const ficha = [
        `${member.stageName}${member.fullName ? ` (${member.fullName})` : ''}.`,
        member.position ? `Posicion en el grupo: ${member.position}.` : '',
        member.birthDate ? `Fecha de nacimiento: ${member.birthDate}.` : '',
        member.nationality ? `Nacionalidad: ${member.nationality}.` : '',
        member.bio ?? '',
      ]
        .filter(Boolean)
        .join(' ');

      items.push({
        key: `member:${member.slug}`,
        sourceLabel: label(locale, 'member', member.stageName),
        sourcePath: `/integrantes/${member.slug}`,
        text: ficha,
      });

      if (member.soloWorks.length > 0) {
        items.push({
          key: `member:${member.slug}:solo`,
          sourceLabel: label(locale, 'solo', member.stageName),
          sourcePath: `/integrantes/${member.slug}`,
          text:
            `Trabajo en solitario de ${member.stageName}: ` +
            member.soloWorks
              .map(
                (work) =>
                  `${work.title} (${work.formatLabel ?? 'lanzamiento'}, ${work.releaseDate.slice(0, 4)})`,
              )
              .join('; ') +
            '.',
        });
      }

      for (const work of member.soloWorks) {
        const canciones = work.tracks
          .map(
            (t) =>
              `${t.trackNumber}. ${t.title}` +
              (t.featuring ? ` (con ${t.featuring})` : '') +
              (t.isTitleTrack ? ' (cancion principal)' : ''),
          )
          .join('; ');

        items.push({
          key: `solo:${work.slug}`,
          sourceLabel: label(locale, 'soloWork', `${member.stageName} — ${work.title}`),
          sourcePath: `/integrantes/${member.slug}`,
          text: [
            `${work.title}, ${work.formatLabel ?? 'lanzamiento'} de ${member.stageName}, publicado el ${work.releaseDate}.`,
            work.description ?? '',
            canciones ? `Canciones: ${canciones}.` : '',
          ]
            .filter(Boolean)
            .join(' '),
        });
      }

      for (const [index, fact] of member.trivia.entries()) {
        items.push({
          key: `member:${member.slug}:trivia:${index}`,
          sourceLabel: label(locale, 'memberTrivia', member.stageName),
          sourcePath: `/curiosidades`,
          text: `${member.stageName}: ${fact.content}`,
        });
      }
    }

    return items;
  }

  private async albums(locale: Locale): Promise<SourceItem[]> {
    const page = await this.get<{ slug: string }[]>(`/api/v1/albums`, locale, { limit: '50' });
    if (!page) return [];

    const items: SourceItem[] = [];

    for (const summary of page) {
      const album = await this.get<{
        slug: string;
        title: string;
        type: string;
        releaseDate: string;
        formatLabel: string | null;
        label: string | null;
        description: string | null;
        tracks: { title: string; trackNumber: number; isTitleTrack: boolean }[];
      }>(`/api/v1/albums/${encodeURIComponent(summary.slug)}`, locale);

      if (!album) continue;

      items.push({
        key: `album:${album.slug}`,
        sourceLabel: label(locale, 'album', album.title),
        sourcePath: `/discografia/${album.slug}`,
        text: [
          `${album.title} (${album.formatLabel ?? album.type}), publicado el ${album.releaseDate}.`,
          album.label ? `Sello: ${album.label}.` : '',
          album.description ?? '',
          album.tracks.length > 0
            ? `Canciones: ${album.tracks
                .map(
                  (t) =>
                    `${t.trackNumber}. ${t.title}${t.isTitleTrack ? ' (cancion principal)' : ''}`,
                )
                .join('; ')}.`
            : '',
        ]
          .filter(Boolean)
          .join(' '),
      });
    }

    return items;
  }

  private async timeline(locale: Locale): Promise<SourceItem[]> {
    const events = await this.get<
      {
        id: string;
        date: string;
        datePrecision: string;
        title: string;
        description: string | null;
      }[]
    >(`/api/v1/timeline`, locale, { limit: '60' });

    return (events ?? []).map((event) => ({
      key: `timeline:${event.id}`,
      sourceLabel: label(locale, 'timeline'),
      sourcePath: '/cronologia',
      text: `${formatDate(event.date, event.datePrecision)}: ${event.title}. ${event.description ?? ''}`.trim(),
    }));
  }

  private async trivia(locale: Locale): Promise<SourceItem[]> {
    const facts = await this.get<{ id: string; category: string; content: string }[]>(
      `/api/v1/trivia`,
      locale,
      { limit: '80' },
    );

    return (facts ?? []).map((fact) => ({
      key: `trivia:${fact.id}`,
      sourceLabel: label(locale, 'trivia'),
      sourcePath: '/curiosidades',
      text: fact.content,
    }));
  }

  private async awards(locale: Locale): Promise<SourceItem[]> {
    const awards = await this.get<
      {
        id: string;
        name: string;
        organization: string;
        year: number;
        work: string | null;
        won: boolean;
      }[]
    >(`/api/v1/awards`, locale, { limit: '100' });

    return (awards ?? []).map((award) => ({
      key: `award:${award.id}`,
      sourceLabel: label(locale, 'awards'),
      sourcePath: '/premios',
      text:
        `${award.won ? 'Premio ganado' : 'Nominacion'}: ${award.name}, ` +
        `${award.organization}, ceremonia de ${award.year}` +
        `${award.work ? `, por ${award.work}` : ''}.`,
    }));
  }

  private async get<T>(
    path: string,
    locale: Locale,
    extra: Record<string, string> = {},
  ): Promise<T | null> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('locale', locale);
    for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);

    for (let attempt = 1; ; attempt += 1) {
      const result = await this.fetchOnce<T>(url, path);
      if (result.kind === 'ok') return result.data;
      if (result.kind === 'transient' && attempt < GET_ATTEMPTS) {
        await sleep(RETRY_PAUSE_MS);
        continue;
      }
      if (result.kind === 'transient') this.failures.get(locale)?.push(path);
      return null;
    }
  }

  private async fetchOnce<T>(
    url: URL,
    path: string,
  ): Promise<{ kind: 'ok'; data: T } | { kind: 'transient' | 'client' }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: this.internalKey ? { 'x-internal-key': this.internalKey } : {},
      });

      if (!response.ok) {
        this.logger.warn(`content-service ${response.status} en ${path}`);
        return { kind: response.status >= 500 ? 'transient' : 'client' };
      }

      const body = (await response.json()) as Envelope<T> & { data?: { items?: T } };

      const data = body.data as unknown;
      if (data && typeof data === 'object' && 'items' in data) {
        return { kind: 'ok', data: (data as { items: T }).items };
      }
      return { kind: 'ok', data: body.data };
    } catch (error) {
      this.logger.warn(`content-service no responde en ${path}: ${String(error)}`);
      return { kind: 'transient' };
    } finally {
      clearTimeout(timer);
    }
  }
}

const GET_ATTEMPTS = 2;
const RETRY_PAUSE_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDate(iso: string, precision: string): string {
  if (precision === 'year') return iso.slice(0, 4);
  if (precision === 'month') return iso.slice(0, 7);
  return iso.slice(0, 10);
}
