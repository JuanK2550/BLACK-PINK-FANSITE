/**
 * ============================================================================
 * CONTRATO HTTP DEL CONTENIDO
 * ============================================================================
 * Estos tipos describen lo que la API DEVUELVE, no lo que la base de datos
 * guarda. No se derivan de Prisma a proposito, y conviene entender por que:
 *
 *   - Prisma tipa `releaseDate` como `Date`; por HTTP viaja como `string`
 *     ISO. Un tipo derivado de Prisma prometeria un `Date` que nunca llega.
 *   - Prisma expone las traducciones como una tabla relacionada; la API las
 *     entrega ya resueltas segun `?locale=`.
 *   - La fila lleva campos internos (`createdAt`, `updatedAt`, claves ajenas)
 *     que la API no publica.
 *
 * Es decir: derivar de Prisma daria tipos que no corresponden al JSON real.
 * Lo que si esta garantizado es que los DTOs de los servicios NO se desvien de
 * este contrato sin que el compilador avise: cada servicio comprueba su
 * compatibilidad en `contract.test-d.ts`.
 * ============================================================================
 */

import type { Locale } from './locale';

/* ==========================================================================
 * Enumeraciones (mismos valores que los enum de la base)
 * ======================================================================= */

export const ALBUM_TYPES = ['SINGLE', 'EP', 'ALBUM', 'COMPILATION', 'COLLABORATION'] as const;
export type AlbumType = (typeof ALBUM_TYPES)[number];

export const SOLO_WORK_TYPES = ['SINGLE', 'EP', 'ALBUM', 'COLLABORATION', 'OST', 'OTHER'] as const;
export type SoloWorkType = (typeof SOLO_WORK_TYPES)[number];

export const TIMELINE_CATEGORIES = [
  'DEBUT',
  'COMEBACK',
  'AWARD',
  'TOUR',
  'RECORD',
  'SOLO',
  'OTHER',
] as const;
export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export const TRIVIA_CATEGORIES = [
  'GROUP',
  'MEMBER',
  'MUSIC',
  'RECORD',
  'FANDOM',
  'STAGE',
  'OTHER',
] as const;
export type TriviaCategory = (typeof TRIVIA_CATEGORIES)[number];

export const QUIZ_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];

/** Precision real de una fecha: "month" significa que el dia es relleno. */
export type DatePrecision = 'day' | 'month' | 'year';

/** Fecha en formato ISO corto, `YYYY-MM-DD`. */
export type IsoDate = string;

/* ==========================================================================
 * Integrantes
 * ======================================================================= */

export interface MemberSummary {
  slug: string;
  stageName: string;
  fullName: string;
  koreanName: string | null;
  /** Papel dentro del grupo, ya resuelto en el idioma pedido. */
  position: string;
  nationality: string;
  birthDate: IsoDate | null;
  colorAccent: string | null;

  /* --- La foto y su atribucion -------------------------------------------
   * Van JUNTAS en el contrato a proposito. La licencia CC BY obliga a
   * acreditar donde se usa la imagen, asi que quien recibe `imageUrl` recibe
   * en la misma respuesta todo lo que necesita para cumplir: no hay forma de
   * pintar la foto sin tener a mano el credito.
   * Si `imageUrl` es null, el resto tambien lo es.
   * ---------------------------------------------------------------------- */

  imageUrl: string | null;
  /** Medidas del archivo servido. Sin ellas hay salto de maquetado al cargar. */
  imageWidth: number | null;
  imageHeight: number | null;
  imageAuthor: string | null;
  /** Nombre legible: "CC BY 3.0". */
  imageLicense: string | null;
  imageLicenseUrl: string | null;
  /** Pagina de origen, para poder comprobar la atribucion. */
  imageSource: string | null;
  /** Cuando se tomo la foto. */
  imageDate: IsoDate | null;
  /** `object-position` de esta foto concreta: "50% 30%". */
  imageFocus: string | null;
  /** Descripcion de la foto, ya en el idioma pedido. */
  imageAlt: string | null;

  /** false = pendiente de contrastar. Por defecto la API no lo devuelve. */
  verified: boolean;
}

/**
 * Una cancion de una obra en solitario.
 *
 * Gemela de `Track` con una diferencia: `featuring`. En el catalogo del grupo
 * no hay invitadas; en solitario son la mitad de los creditos («Handlebars»
 * con Dua Lipa, «New Woman» con ROSALIA), y sin ese campo la lista las
 * atribuiria enteras a la integrante.
 */
export interface SoloTrack {
  id: string;
  title: string;
  trackNumber: number;
  /** Null mientras no se resuelva contra la API oficial. */
  durationSec: number | null;
  isTitleTrack: boolean;
  /** Invitadas tal como las acredita el lanzamiento, o null. */
  featuring: string | null;
  /** Identificador para el reproductor OFICIAL. El sitio no sirve audio. */
  spotifyId: string | null;
  verified: boolean;
}

export interface SoloWork {
  slug: string;
  title: string;
  type: SoloWorkType;
  releaseDate: IsoDate;
  formatLabel: string | null;
  description: string | null;
  /**
   * Portada, servida por la CDN de Spotify. El sitio no la aloja ni la
   * reescala: alojarla seria servir una imagen con copyright y reescalarla
   * seria modificar contenido de Spotify.
   *
   * Por eso viajan tambien sus MEDIDAS: la imagen no pasa por el optimizador
   * de Next, asi que el navegador no puede reservar el hueco sin que alguien
   * se las diga. Si `coverUrl` es null, las dos tambien lo son.
   */
  coverUrl: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  /**
   * La MISMA portada en el tamano pequeno que publica Spotify (300px).
   *
   * Existe porque la portada va `unoptimized` -no pasa por el optimizador de
   * Next, para no re-alojar ni reescalar material con copyright- y sin
   * optimizador no hay srcset: `sizes` no hace nada. Para un hueco de 56px, la
   * unica forma de no descargar el archivo de 640 es tener esta.
   *
   * Null si Spotify no publicara una variante pequena; entonces se usa la
   * grande, que pesa mas pero nunca se ve borrosa.
   */
  coverThumbUrl: string | null;
  coverThumbWidth: number | null;
  coverThumbHeight: number | null;
  /** Null mientras no se resuelva contra la API oficial. */
  durationSec: number | null;
  /** Identificador para el reproductor OFICIAL. El sitio no sirve audio. */
  spotifyId: string | null;
  verified: boolean;
  /**
   * Las canciones del lanzamiento, en orden. Vacio si la obra aun no tiene su
   * lista contrastada: entonces la ficha usa `spotifyId`, la principal.
   */
  tracks: SoloTrack[];
}

export interface MemberTrivia {
  id: string;
  category: TriviaCategory;
  content: string;
  /** De donde sale el dato. */
  source: string;
  verified: boolean;
}

export interface MemberTimelineEvent {
  id: string;
  date: IsoDate;
  datePrecision: DatePrecision;
  title: string;
  description: string | null;
  category: TimelineCategory;
  /** De 1 a 5. */
  importance: number;
  verified: boolean;
}

export interface MemberDetail extends MemberSummary {
  nickname: string | null;
  bio: string | null;
  description: string | null;
  /** Cuentas publicas oficiales. Nunca informacion personal privada. */
  socials: Record<string, string> | null;
  soloWorks: SoloWork[];
  trivia: MemberTrivia[];
  timeline: MemberTimelineEvent[];
}

/* ==========================================================================
 * Discografia
 * ======================================================================= */

export interface Track {
  id: string;
  title: string;
  trackNumber: number;
  /** Null mientras no se resuelva contra la API oficial. */
  durationSec: number | null;
  isTitleTrack: boolean;
  localizedTitle: string | null;
  spotifyId: string | null;
  lyricsAvailable: boolean;
  verified: boolean;
}

export interface AlbumSummary {
  slug: string;
  title: string;
  type: AlbumType;
  releaseDate: IsoDate;
  year: number;
  formatLabel: string | null;
  label: string | null;
  /**
   * Portada, servida por la CDN de Spotify. El sitio no la aloja ni la
   * reescala: alojarla seria servir una imagen con copyright y reescalarla
   * seria modificar contenido de Spotify.
   *
   * Por eso viajan tambien sus MEDIDAS: la imagen no pasa por el optimizador
   * de Next, asi que el navegador no puede reservar el hueco sin que alguien
   * se las diga. Si `coverUrl` es null, las dos tambien lo son.
   */
  coverUrl: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  /**
   * La MISMA portada en el tamano pequeno que publica Spotify (300px).
   *
   * Existe porque la portada va `unoptimized` -no pasa por el optimizador de
   * Next, para no re-alojar ni reescalar material con copyright- y sin
   * optimizador no hay srcset: `sizes` no hace nada. Para un hueco de 56px, la
   * unica forma de no descargar el archivo de 640 es tener esta.
   *
   * Null si Spotify no publicara una variante pequena; entonces se usa la
   * grande, que pesa mas pero nunca se ve borrosa.
   */
  coverThumbUrl: string | null;
  coverThumbWidth: number | null;
  coverThumbHeight: number | null;
  trackCount: number;
  verified: boolean;
}

export interface AlbumDetail extends AlbumSummary {
  description: string | null;
  spotifyId: string | null;
  tracks: Track[];
}

export interface TrackDetail extends Track {
  album: { slug: string; title: string; releaseDate: IsoDate };
}

/* ==========================================================================
 * Cronologia, curiosidades, premios y quiz
 * ======================================================================= */

export interface TimelineEvent {
  id: string;
  date: IsoDate;
  datePrecision: DatePrecision;
  title: string;
  description: string | null;
  category: TimelineCategory;
  importance: number;
  memberSlug: string | null;
  imageUrl: string | null;
  source: string | null;
  verified: boolean;
}

export interface Trivia {
  id: string;
  category: TriviaCategory;
  content: string;
  source: string;
  memberSlug: string | null;
  verified: boolean;
}

export interface Award {
  id: string;
  name: string;
  category: string;
  /** Ano de la CEREMONIA, no de la obra premiada. */
  year: number;
  organization: string;
  /** Obra premiada, cuando el premio va por una en concreto. */
  work: string | null;
  /** true = ganado, false = nominado. */
  won: boolean;
  source: string | null;
  verified: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  difficulty: QuizDifficulty;
  /** Solo presentes si se pidio `includeAnswers=true`. */
  correctIndex?: number;
  explanation?: string | null;
}

/* ==========================================================================
 * Busqueda
 * ======================================================================= */

export type SearchHitType = 'member' | 'album' | 'track' | 'timeline';

export interface SearchHit {
  type: SearchHitType;
  id: string;
  title: string;
  subtitle: string | null;
  /** Ruta relativa dentro del sitio. */
  href: string;
}

export interface SearchResult {
  query: string;
  total: number;
  members: SearchHit[];
  albums: SearchHit[];
  tracks: SearchHit[];
  timeline: SearchHit[];
}

/* ==========================================================================
 * Media
 * ======================================================================= */

export interface EmbedTarget {
  id: string;
  /** URL del reproductor incrustable, para el `src` de un iframe. */
  embedUrl: string;
  /** URL para abrir la cancion en la plataforma. */
  watchUrl: string;
}

export interface PlaylistEntry {
  position: number;
  title: string;
  subtitle: string | null;
  durationSec: number | null;
  spotify: EmbedTarget | null;
  /** false si todavia no hay reproductor oficial disponible. */
  playable: boolean;
}

/**
 * De donde sale la seleccion de una playlist.
 *
 * `derived`: de un criterio comprobable en los datos (el ano, si es cancion
 * principal). `curated`: es un juicio editorial del sitio, y la interfaz lo
 * dice. El sitio no publica opiniones disfrazadas de datos.
 */
export type PlaylistBasis = 'derived' | 'curated';

export interface PlaylistSummary {
  slug: string;
  title: string;
  description: string;
  trackCount: number;
  basis: PlaylistBasis;
}

export interface PlaylistDetail extends PlaylistSummary {
  entries: PlaylistEntry[];
  playableCount: number;
  /** Explica por que la lista no es reproducible, cuando no lo es. */
  note: string | null;
}

export interface TrackEmbed {
  trackId: string;
  title: string;
  album: { slug: string; title: string; year: number } | null;
  spotify: EmbedTarget | null;
  available: boolean;
  note: string | null;
}

/* ==========================================================================
 * Parametros de consulta comunes
 * ======================================================================= */

export interface LocaleParams {
  locale?: Locale;
}

export interface PaginationParams {
  page?: number;
  /** Maximo 100. */
  limit?: number;
}

/**
 * USO INTERNO. Incluye lo que aun no se ha contrastado contra su fuente.
 * El sitio publico no lo envia nunca.
 */
export interface UnverifiedParams {
  includeUnverified?: boolean;
}

export type ContentParams = LocaleParams & PaginationParams & UnverifiedParams;
