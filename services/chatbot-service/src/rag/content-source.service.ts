import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Locale } from '@blackpink/types';

/**
 * ============================================================================
 * DE DONDE SALE LO QUE SABE PINKY
 * ============================================================================
 * Del MISMO sitio que lo lee un visitante: la API publica de content-service,
 * por HTTP. No de la base de datos.
 *
 * Esto no es una preferencia de estilo, es la garantia que sostiene la regla
 * critica de esta fase: **el indice no puede contener nada sin contrastar**.
 * Leyendo por la API publica, el filtro de `verified` ya esta aplicado rio
 * arriba por el dueno del dato; no hay una segunda implementacion del filtro
 * que pueda divergir de la primera.
 *
 * `?includeUnverified=true` es de uso interno y NO se envia nunca desde aqui,
 * igual que no lo envia apps/web. Si algun dia alguien lo anade, el test
 * `no pide contenido sin contrastar` falla.
 * ============================================================================
 */

export interface SourceItem {
  /** Clave estable dentro de su tipo. */
  key: string;
  sourceLabel: string;
  /** Ruta sin prefijo de idioma. */
  sourcePath: string;
  text: string;
}

interface Envelope<T> {
  data: T;
}

/**
 * Nombres de seccion, en los tres idiomas.
 *
 * Estas etiquetas SE LE ENSENAN AL VISITANTE como cita ("segun la cronologia
 * del sitio") y como texto del boton de navegacion. Estaban escritas solo en
 * castellano, asi que una respuesta en coreano citaba "Trabajo en solitario de
 * ROSE": el contenido traducido y la fuente sin traducir, que es justo la
 * mitad del trabajo.
 */
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
  /** Rutas que no respondieron en la ultima recogida de cada idioma. */
  private readonly failures = new Map<Locale, string[]>();

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('CONTENT_SERVICE_URL')?.trim() || 'http://localhost:4001'
    ).replace(/\/+$/, '');
    this.internalKey = config.get<string>('INTERNAL_API_KEY')?.trim() ?? '';
  }

  /**
   * Todo el contenido publicable, en un idioma, ya convertido a texto plano.
   *
   * Cada seccion se pide por separado y los fallos NO son fatales: si la
   * cronologia no responde, se indexa el resto. Un indice parcial sirve; un
   * arranque abortado deja el chat mudo entero.
   */
  async collect(locale: Locale): Promise<SourceItem[]> {
    return (await this.collectWithReport(locale)).items;
  }

  /**
   * Lo mismo, diciendo ademas QUE NO LLEGO.
   *
   * Sin esto, el indexador no distinguia «content-service no tiene albumes» de
   * «content-service no respondio a los albumes», y con un 500 puntual
   * sustituia un indice completo por uno sin discografia. Pasaba de verdad:
   * PINKY en coreano se quedo sin un solo album hasta el siguiente reindexado.
   * Quien decide que hacer con un indice incompleto es el indexador.
   */
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

  /* ------------------------------------------------------------ fuentes --- */

  private async members(locale: Locale): Promise<SourceItem[]> {
    const list = await this.get<{ slug: string }[]>(`/api/v1/members`, locale);
    if (!list) return [];

    const items: SourceItem[] = [];

    for (const summary of list) {
      /*
       * LOS CAMPOS SON LOS DEL CONTRATO (`MemberDetail` en packages/types).
       * Antes se leian `role` y `birthPlace`, que la API no ha devuelto nunca:
       * los dos llegaban siempre vacios y PINKY no sabia ni la posicion ni la
       * nacionalidad de ninguna integrante. Nada fallaba; solo faltaba.
       */
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

      /*
       * UN FRAGMENTO POR OBRA, con TODAS sus canciones.
       *
       * El fragmento de arriba es el indice: que obras hay y de que año. Sin
       * este, PINKY sabia que Jennie publico «Ruby» pero no podia decir que
       * canciones trae ni con quien canta «Handlebars». Las invitadas van
       * dentro de cada cancion, que es donde se preguntan.
       */
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

  /* ------------------------------------------------------------- fetch --- */

  private async get<T>(
    path: string,
    locale: Locale,
    extra: Record<string, string> = {},
  ): Promise<T | null> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('locale', locale);
    for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);

    /*
     * NUNCA se anade includeUnverified. El indice publica lo mismo que el
     * sitio: ni un dato mas.
     */

    /*
     * UN REINTENTO, y solo ante lo transitorio: un 5xx o la red. El 500 que
     * motivo esto fue «Unable to start a transaction in the given time», un
     * pool de Postgres saturado durante un segundo. Un 4xx no se reintenta:
     * describe la peticion, y repetirla da lo mismo.
     */
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
        headers: this.internalKey
          ? // El SSR y el indexado llaman desde una sola IP: sin esto, el
            // limite por IP pensado para un visitante cae sobre el indexado
            // entero a mitad de camino.
            { 'x-internal-key': this.internalKey }
          : {},
      });

      if (!response.ok) {
        this.logger.warn(`content-service ${response.status} en ${path}`);
        return { kind: response.status >= 500 ? 'transient' : 'client' };
      }

      const body = (await response.json()) as Envelope<T> & { data?: { items?: T } };

      // El envelope de paginacion mete los elementos en data.items.
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

/** Ni una fecha con mas precision de la que tiene, tambien aqui. */
function formatDate(iso: string, precision: string): string {
  if (precision === 'year') return iso.slice(0, 4);
  if (precision === 'month') return iso.slice(0, 7);
  return iso.slice(0, 10);
}
