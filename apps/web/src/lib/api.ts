import type {
  AlbumDetail,
  AlbumSummary,
  ApiEnvelope,
  Award,
  ContentParams,
  MemberDetail,
  MemberSummary,
  PageMeta,
  PlaylistDetail,
  PlaylistSummary,
  QuizQuestion,
  SearchResult,
  TimelineEvent,
  TrackEmbed,
  Trivia,
} from '@blackpink/types';

/**
 * ============================================================================
 * CLIENTE DE LA API
 * ============================================================================
 * Unico punto por el que el frontend habla con el gateway. Todo lo demas
 * importa funciones de aqui, nunca llama a `fetch` por su cuenta.
 *
 * CUATRO COSAS QUE RESUELVE:
 *
 * 1. TIEMPO LIMITE. `fetch` no tiene uno por defecto: una peticion que no
 *    responde se queda colgada para siempre y deja la pagina cargando sin
 *    fin. Aqui toda llamada aborta a los 8 segundos.
 *
 * 2. REINTENTOS ACOTADOS. Solo ante fallo de red o 5xx, y nunca ante un 4xx:
 *    reintentar un 404 no lo convierte en un 200, solo triplica la espera.
 *
 * 3. ERRORES TIPADOS. Un fallo lanza `ApiError` con su codigo estable, para
 *    que la interfaz distinga "no existe" de "el servicio no responde" sin
 *    leer el texto del mensaje.
 *
 * 4. NUNCA `includeUnverified`. El parametro existe en la API pero es de uso
 *    interno: este cliente no lo expone en ninguna firma, asi que el sitio
 *    publico no puede enviarlo ni por descuido.
 * ============================================================================
 */

const BASE_URL = (
  process.env.API_GATEWAY_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000'
).replace(/\/+$/, '');

const TIMEOUT_MS = 8000;

/**
 * Clave de servicio para las llamadas hechas DESDE EL SERVIDOR.
 *
 * El gateway limita las peticiones por IP. Como el renderizado en servidor las
 * hace todas desde la IP del proceso de Next, sin esta clave el limite pensado
 * para un visitante se aplicaria al sitio entero: en el build, las 59 paginas
 * prerenderizadas se cortan a si mismas a mitad.
 *
 * La variable NO lleva prefijo `NEXT_PUBLIC_`, asi que Next nunca la inyecta
 * en el bundle del navegador. Aun asi, la cabecera solo se anade cuando no hay
 * `window`: si algun dia alguien la renombrara por error a una variable
 * publica, esta comprobacion evita que el secreto salga en una peticion del
 * cliente.
 */
const INTERNAL_KEY = process.env.INTERNAL_API_KEY;
const IS_SERVER = typeof window === 'undefined';
const RETRIES = 2;

/** Error de la API, con el codigo estable que devuelve el gateway. */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code: string,
    readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** El recurso no existe. La interfaz muestra un 404, no un error. */
  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /** El servicio no responde. Es temporal: tiene sentido reintentar. */
  get isUnavailable(): boolean {
    return this.statusCode >= 500 || this.code === 'UPSTREAM_UNAVAILABLE';
  }
}

export interface RequestOptions {
  /**
   * Segundos de revalidacion ISR. Se traduce a `next.revalidate`.
   * `0` desactiva la cache de Next (para datos que cambian en cada peticion).
   */
  revalidate?: number;
  /** Etiquetas de cache de Next, para invalidar por grupos. */
  tags?: string[];
  signal?: AbortSignal;
}

export interface Page<T> {
  items: T[];
  pagination: PageMeta;
}

/* ==========================================================================
 * Motor
 * ======================================================================= */

function buildUrl(path: string, params: Record<string, unknown> = {}): string {
  const url = new URL(`${BASE_URL}/api/v1${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function request<T>(
  path: string,
  params: Record<string, unknown>,
  options: RequestOptions,
): Promise<{ data: T; meta: ApiEnvelope<T>['meta'] }> {
  const url = buildUrl(path, params);
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    /*
     * El tiempo límite se monta a mano y se CANCELA en cuanto llega la
     * respuesta. `AbortSignal.timeout()` no sirve aquí: se dispara siempre a
     * los 8 s aunque el fetch haya terminado en 20 ms, y Next escribe su caché
     * de forma diferida, después de resolver la promesa. Al hacerlo se
     * encuentra la señal ya abortada y falla con "Failed to set fetch cache",
     * así que la petición se repite en cada visita y la revalidación ISR deja
     * de existir en la práctica.
     *
     * Un AbortController por intento: reutilizar uno ya abortado haría que el
     * segundo intento fallara al instante sin llegar a salir.
     */
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const onExternalAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          // Solo en servidor: identifica la llamada como interna ante el gateway.
          ...(IS_SERVER && INTERNAL_KEY ? { 'x-internal-key': INTERNAL_KEY } : {}),
        },
        next:
          options.revalidate === undefined
            ? undefined
            : { revalidate: options.revalidate, tags: options.tags },
      });

      clearTimeout(timer);

      const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

      if (response.ok && envelope?.data !== undefined && envelope.data !== null) {
        return { data: envelope.data, meta: envelope.meta };
      }

      const error = new ApiError(
        response.status,
        envelope?.error?.message ?? 'La API ha devuelto una respuesta inesperada.',
        envelope?.error?.code ?? 'INTERNAL_ERROR',
        envelope?.error?.details,
      );

      // Un 4xx es definitivo: la peticion esta mal y repetirla no la arregla.
      if (response.status < 500) throw error;
      lastError = error;
    } catch (error) {
      clearTimeout(timer);
      // Si quien llama cancelo, se respeta: no es un fallo que reintentar.
      if (options.signal?.aborted) throw error;
      if (error instanceof ApiError && error.statusCode < 500) throw error;
      lastError = error;
    } finally {
      options.signal?.removeEventListener('abort', onExternalAbort);
    }

    if (attempt < RETRIES) {
      await delay(2 ** attempt * 150 + Math.random() * 100);
    }
  }

  if (lastError instanceof ApiError) throw lastError;

  throw new ApiError(
    503,
    'No hemos podido conectar con el servidor. Intentalo de nuevo en un momento.',
    'UPSTREAM_UNAVAILABLE',
  );
}

/** Colecciones: el gateway devuelve los elementos en `data` y el estado en `meta`. */
async function requestPage<T>(
  path: string,
  params: Record<string, unknown>,
  options: RequestOptions,
): Promise<Page<T>> {
  const { data, meta } = await request<T[]>(path, params, options);

  return {
    items: data,
    pagination: meta.pagination ?? {
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ==========================================================================
 * Tiempos de revalidacion
 * ------------------------------------------------------------------------
 * El contenido cambia poco, asi que se sirve estatico y se regenera de fondo.
 * Los numeros son mas altos que los TTL del gateway a proposito: son dos
 * caches en serie, y la de Next evita incluso la llamada de red.
 * ======================================================================= */
export const REVALIDATE = {
  /** Fichas y discografia: cambian cuando se edita contenido. */
  content: 3600,
  /** Cronologia y curiosidades: se amplian de vez en cuando. */
  catalog: 1800,
  /** Playlists: dependen del contenido, no de la hora. */
  media: 3600,
} as const;

/* ==========================================================================
 * Contenido
 * ======================================================================= */

export function getMembers(params: ContentParams = {}, options: RequestOptions = {}) {
  return request<MemberSummary[]>(
    '/content/members',
    { locale: params.locale },
    { revalidate: REVALIDATE.content, tags: ['members'], ...options },
  ).then((result) => result.data);
}

export function getMember(slug: string, params: ContentParams = {}, options: RequestOptions = {}) {
  return request<MemberDetail>(
    `/content/members/${encodeURIComponent(slug)}`,
    { locale: params.locale },
    { revalidate: REVALIDATE.content, tags: ['members', `member:${slug}`], ...options },
  ).then((result) => result.data);
}

export interface AlbumsParams extends ContentParams {
  type?: 'SINGLE' | 'EP' | 'ALBUM' | 'COMPILATION' | 'COLLABORATION';
  sort?: 'releaseDate_desc' | 'releaseDate_asc' | 'title_asc' | 'title_desc';
}

export function getAlbums(params: AlbumsParams = {}, options: RequestOptions = {}) {
  return requestPage<AlbumSummary>(
    '/content/albums',
    {
      locale: params.locale,
      type: params.type,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    },
    { revalidate: REVALIDATE.content, tags: ['albums'], ...options },
  );
}

export function getAlbum(slug: string, params: ContentParams = {}, options: RequestOptions = {}) {
  return request<AlbumDetail>(
    `/content/albums/${encodeURIComponent(slug)}`,
    { locale: params.locale },
    { revalidate: REVALIDATE.content, tags: ['albums', `album:${slug}`], ...options },
  ).then((result) => result.data);
}

export interface TimelineParams extends ContentParams {
  category?: TimelineEvent['category'];
  from?: string;
  to?: string;
  memberSlug?: string;
}

export function getTimeline(params: TimelineParams = {}, options: RequestOptions = {}) {
  return requestPage<TimelineEvent>(
    '/content/timeline',
    {
      locale: params.locale,
      category: params.category,
      from: params.from,
      to: params.to,
      memberSlug: params.memberSlug,
      page: params.page,
      limit: params.limit,
    },
    { revalidate: REVALIDATE.catalog, tags: ['timeline'], ...options },
  );
}

export interface TriviaParams extends ContentParams {
  category?: Trivia['category'];
  memberSlug?: string;
  random?: boolean;
}

export function getTrivia(params: TriviaParams = {}, options: RequestOptions = {}) {
  return requestPage<Trivia>(
    '/content/trivia',
    {
      locale: params.locale,
      category: params.category,
      memberSlug: params.memberSlug,
      random: params.random,
      page: params.page,
      limit: params.limit,
    },
    {
      // Una seleccion aleatoria cacheada deja de ser aleatoria.
      revalidate: params.random ? 0 : REVALIDATE.catalog,
      tags: ['trivia'],
      ...options,
    },
  );
}

export function getAwards(params: ContentParams = {}, options: RequestOptions = {}) {
  return requestPage<Award>(
    '/content/awards',
    { locale: params.locale, page: params.page, limit: params.limit },
    { revalidate: REVALIDATE.catalog, tags: ['awards'], ...options },
  );
}

export interface QuizParams extends ContentParams {
  difficulty?: QuizQuestion['difficulty'];
  random?: boolean;
  includeAnswers?: boolean;
}

export function getQuizQuestions(params: QuizParams = {}, options: RequestOptions = {}) {
  return requestPage<QuizQuestion>(
    '/content/quiz/questions',
    {
      locale: params.locale,
      difficulty: params.difficulty,
      random: params.random,
      includeAnswers: params.includeAnswers,
      limit: params.limit,
    },
    { revalidate: params.random ? 0 : REVALIDATE.catalog, tags: ['quiz'], ...options },
  );
}

export function search(query: string, params: ContentParams = {}, options: RequestOptions = {}) {
  return request<SearchResult>(
    '/content/search',
    { q: query, locale: params.locale, limit: params.limit },
    // La busqueda es interactiva: no se cachea en Next, la cachea el gateway.
    { revalidate: 0, ...options },
  ).then((result) => result.data);
}

/* ==========================================================================
 * Media
 * ======================================================================= */

export function getPlaylists(params: ContentParams = {}, options: RequestOptions = {}) {
  return request<PlaylistSummary[]>(
    '/media/playlists',
    { locale: params.locale },
    { revalidate: REVALIDATE.media, tags: ['playlists'], ...options },
  ).then((result) => result.data);
}

export function getPlaylist(
  slug: string,
  params: ContentParams = {},
  options: RequestOptions = {},
) {
  return request<PlaylistDetail>(
    `/media/playlists/${encodeURIComponent(slug)}`,
    { locale: params.locale },
    { revalidate: REVALIDATE.media, tags: ['playlists', `playlist:${slug}`], ...options },
  ).then((result) => result.data);
}

export function getTrackEmbed(
  id: string,
  params: ContentParams = {},
  options: RequestOptions = {},
) {
  return request<TrackEmbed>(
    `/media/tracks/${encodeURIComponent(id)}/embed`,
    { locale: params.locale },
    { revalidate: REVALIDATE.media, tags: [`embed:${id}`], ...options },
  ).then((result) => result.data);
}
