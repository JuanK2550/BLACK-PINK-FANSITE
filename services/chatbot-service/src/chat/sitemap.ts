import type { Locale } from '@blackpink/types';

/**
 * ============================================================================
 * MAPA DEL SITIO Y CONTRATO DE ACCIONES
 * ============================================================================
 * PINKY no solo responde: lleva. Cuando la pregunta es "donde veo X", la
 * respuesta util no es un parrafo, es un enlace.
 *
 * TRES ACCIONES Y NINGUNA MAS:
 *
 *   navigate      llevar a una pagina concreta del sitio
 *   open_section  desplazar a una seccion dentro de la pagina actual
 *   none          no hay nada que abrir
 *
 * NO EXISTE `play_track`, y no es un olvido. El sitio retiro el reproductor
 * controlable: lo unico que suena es el iframe oficial de Spotify, que no
 * acepta ordenes desde la pagina que lo incrusta. Una accion "reproducir" que
 * el frontend no puede cumplir seria una promesa rota en el contrato. PINKY
 * lleva a la ficha del album, y alli el visitante le da al play.
 *
 * LAS RUTAS LLEVAN PREFIJO DE IDIOMA. `localePrefix: 'always'` en next-intl,
 * asi que `/integrantes/rose` no existe: es `/es/integrantes/rose`. Devolver la
 * ruta sin prefijo daria un 404 al pulsar.
 * ============================================================================
 */

export type ChatActionType = 'navigate' | 'open_section' | 'none';

export interface ChatAction {
  action: ChatActionType;
  /** Ruta completa con idioma, o null en `none`. */
  path: string | null;
  /** Texto del boton, en el idioma de la conversacion. */
  label: string | null;
}

export const NO_ACTION: ChatAction = { action: 'none', path: null, label: null };

interface Section {
  path: string;
  labels: Record<Locale, string>;
  /** Como se lo describimos al modelo. */
  describes: string;
}

export const SECTIONS: Section[] = [
  {
    path: '/grupo',
    labels: { es: 'Ir a Grupo', en: 'Go to Group', ko: '그룹 페이지로' },
    describes: 'presentacion del grupo',
  },
  {
    path: '/integrantes',
    labels: { es: 'Ver integrantes', en: 'See members', ko: '멤버 보기' },
    describes: 'las cuatro integrantes',
  },
  {
    path: '/discografia',
    labels: { es: 'Ver discografia', en: 'See discography', ko: '디스코그래피 보기' },
    describes: 'albumes y canciones',
  },
  {
    path: '/cronologia',
    labels: { es: 'Ver cronologia', en: 'See timeline', ko: '연표 보기' },
    describes: 'hitos desde el debut',
  },
  {
    path: '/curiosidades',
    labels: { es: 'Ver curiosidades', en: 'See fun facts', ko: '비하인드 보기' },
    describes: 'curiosidades y records',
  },
  {
    path: '/premios',
    labels: { es: 'Ver premios', en: 'See awards', ko: '수상 보기' },
    describes: 'palmares de premios y nominaciones',
  },
  {
    path: '/playlists',
    labels: { es: 'Ver playlists', en: 'See playlists', ko: '플레이리스트 보기' },
    describes: 'selecciones de canciones',
  },
  /*
   * Las tres paginas de la Fase 12. Faltaban aqui, y como lo que no esta en
   * el mapa se degrada a `none`, PINKY no podia mandar a nadie a la galeria,
   * al quiz ni al comparador aunque se lo pidieran con esas palabras.
   */
  {
    path: '/galeria',
    labels: { es: 'Ver galeria', en: 'See gallery', ko: '갤러리 보기' },
    describes: 'fotografias del grupo y de cada integrante',
  },
  {
    path: '/quiz',
    labels: { es: 'Jugar al quiz', en: 'Play the quiz', ko: '퀴즈 하기' },
    describes: 'quiz de preguntas sobre el grupo',
  },
  {
    path: '/integrantes/comparar',
    labels: { es: 'Comparar integrantes', en: 'Compare members', ko: '멤버 비교하기' },
    describes: 'comparar dos integrantes lado a lado',
  },
];

/** Descripcion del mapa para el prompt. */
export function describeSitemap(): string {
  return SECTIONS.map((section) => `${section.path} — ${section.describes}`).join('\n');
}

/** Ruta completa con prefijo de idioma. */
export function localizePath(path: string, locale: Locale): string {
  return `/${locale}${path}`;
}

/**
 * Convierte lo que propone el modelo en una accion valida.
 *
 * SE VALIDA CONTRA EL MAPA, no se acepta lo que diga. El modelo puede inventar
 * una ruta plausible que no existe -`/integrantes/jennie/discografia`- y el
 * visitante se comeria un 404 con la firma del sitio. Lo que no encaja se
 * degrada a `none`, que es una respuesta honesta.
 */
/** Una pagina concreta que aparecio en el contexto, con su nombre real. */
export interface KnownTarget {
  path: string;
  label: string;
}

export function resolveAction(
  raw: { action?: string; path?: string } | null,
  locale: Locale,
  known: KnownTarget[],
): ChatAction {
  if (!raw || !raw.action || raw.action === 'none' || !raw.path) return NO_ACTION;
  if (raw.action !== 'navigate' && raw.action !== 'open_section') return NO_ACTION;

  const path = raw.path.startsWith('/') ? raw.path : `/${raw.path}`;

  // Quita el prefijo de idioma si el modelo lo puso, para comparar sin ruido.
  const bare = path.replace(/^\/(es|en|ko)(?=\/|$)/, '');

  const section = SECTIONS.find((entry) => entry.path === bare);
  if (section) {
    return {
      action: raw.action,
      path: localizePath(section.path, locale),
      label: section.labels[locale],
    };
  }

  /*
   * Rutas de detalle (`/integrantes/rose`, `/discografia/born-pink`): valen
   * solo si aparecieron en el contexto recuperado.
   *
   * La etiqueta sale del NOMBRE de la seccion, no del slug. Derivarla de la
   * ruta daba botones como "Ir a born pink", con el titulo en minusculas y
   * partido por guiones; el fragmento recuperado ya trae "Ficha de BORN PINK",
   * que es como lo llama el propio sitio.
   */
  const target = known.find((entry) => entry.path === bare);
  if (target) {
    return {
      action: raw.action,
      path: localizePath(bare, locale),
      label: target.label,
    };
  }

  return NO_ACTION;
}
