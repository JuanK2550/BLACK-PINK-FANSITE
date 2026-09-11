import type { Locale } from '@blackpink/types';

/**
 * ============================================================================
 * PLAYLISTS CURADAS
 * ============================================================================
 * media-service NO tiene base de datos propia y NO es dueno del contenido: las
 * canciones viven en content-service. Aqui solo vive la CURADURIA, que es lo
 * unico que este servicio aporta de verdad: que canciones van juntas y en que
 * orden.
 *
 * Cada elemento es una referencia estable, no un identificador de fila:
 *   - una pista se referencia por (albumSlug, trackNumber)
 *   - un trabajo en solitario por (memberSlug, soloWorkSlug)
 *
 * Se hace asi a proposito. Los ids de content-service son cuid generados en el
 * seed: son estables dentro de una base pero no se reproducen en otra, asi que
 * una playlist que los guardase se romperia en cada entorno nuevo.
 *
 * ESTE SERVICIO NO SIRVE AUDIO. Solo dice que suena, en que orden, y devuelve
 * los identificadores para incrustar los reproductores oficiales.
 *
 * ---------------------------------------------------------------------------
 * DOS CLASES DE LISTA, Y LA DIFERENCIA IMPORTA
 * ---------------------------------------------------------------------------
 * `basis: 'derived'`  La lista sale de un criterio COMPROBABLE en los datos:
 *                     el ano de publicacion, o si la cancion es title track.
 *                     Cualquiera puede verificar que no falta ni sobra nada.
 *
 * `basis: 'curated'`  La lista es un JUICIO EDITORIAL del sitio: que canciones
 *                     son baladas, o cuales sirven para bailar. No hay dato en
 *                     la base que lo decida, asi que la interfaz lo marca como
 *                     seleccion propia en vez de presentarlo como un hecho.
 *
 * La distincion existe porque este proyecto no publica opiniones disfrazadas
 * de datos. Una playlist de baladas es legitima; presentarla como si fuera
 * informacion oficial del grupo, no.
 * ---------------------------------------------------------------------------
 */

export type PlaylistItem =
  | { kind: 'track'; albumSlug: string; trackNumber: number }
  | { kind: 'solo'; memberSlug: string; soloWorkSlug: string };

export type PlaylistBasis = 'derived' | 'curated';

export interface PlaylistDefinition {
  slug: string;
  /** Orden en el que se listan las playlists. */
  order: number;
  /** Si el criterio es comprobable en los datos o es seleccion editorial. */
  basis: PlaylistBasis;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  items: PlaylistItem[];
}

const track = (albumSlug: string, trackNumber: number): PlaylistItem => ({
  kind: 'track',
  albumSlug,
  trackNumber,
});

const solo = (memberSlug: string, soloWorkSlug: string): PlaylistItem => ({
  kind: 'solo',
  memberSlug,
  soloWorkSlug,
});

export const PLAYLISTS: PlaylistDefinition[] = [
  {
    slug: 'debut-era',
    order: 1,
    basis: 'derived',
    title: { es: 'Debut Era', en: 'Debut Era', ko: '데뷔 시절' },
    description: {
      es: 'Todo lo publicado entre 2016 y 2017, en orden cronologico: los dos album sencillo del debut y el single que cerro esa etapa.',
      en: 'Everything released between 2016 and 2017, in chronological order: the two debut single albums and the single that closed that stretch.',
      ko: '2016년부터 2017년까지 발표한 모든 곡을 발매 순서대로. 데뷔 싱글 앨범 두 장과 그 시기를 마무리한 싱글.',
    },
    items: [
      track('square-one', 1),
      track('square-one', 2),
      track('square-two', 1),
      track('square-two', 2),
      track('square-two', 3),
      track('as-if-its-your-last', 1),
    ],
  },

  {
    slug: 'grandes-exitos',
    order: 2,
    basis: 'derived',
    title: { es: 'Grandes Exitos', en: 'Greatest Hits', ko: '대표곡' },
    description: {
      es: 'Todas las canciones principales del grupo, de 2016 a 2022. El criterio no es de gusto: son las marcadas como cancion principal de su lanzamiento.',
      en: 'Every title track by the group, from 2016 to 2022. Not a matter of taste: these are the songs marked as the title track of their release.',
      ko: '2016년부터 2022년까지 그룹의 모든 타이틀곡. 취향이 아니라 각 발매작의 타이틀곡으로 표시된 곡들입니다.',
    },
    items: [
      track('square-one', 1),
      track('square-one', 2),
      track('square-two', 1),
      track('square-two', 2),
      track('as-if-its-your-last', 1),
      track('square-up', 1),
      track('kill-this-love', 1),
      track('the-album', 1),
      track('the-album', 2),
      track('the-album', 5),
      track('born-pink', 1),
      track('born-pink', 2),
    ],
  },

  {
    slug: 'baladas',
    order: 3,
    basis: 'curated',
    title: { es: 'Baladas', en: 'Ballads', ko: '발라드' },
    description: {
      es: 'Las canciones de tempo lento del catalogo. Seleccion del sitio: no hay ningun dato en la ficha que clasifique una cancion como balada.',
      en: 'The slow-tempo songs in the catalogue. Our own pick: nothing in the data classifies a song as a ballad.',
      ko: '카탈로그에서 느린 템포의 곡들. 데이터에 발라드를 구분하는 항목이 없어 사이트가 직접 고른 선곡입니다.',
    },
    items: [
      track('square-two', 2),
      track('square-two', 3),
      track('kill-this-love', 2),
      track('kill-this-love', 4),
      track('the-album', 8),
      track('born-pink', 6),
      track('born-pink', 8),
    ],
  },

  {
    slug: 'solistas',
    order: 4,
    basis: 'derived',
    title: { es: 'Solistas', en: 'Solo Work', ko: '솔로' },
    description: {
      es: 'El trabajo en solitario de las cuatro, en orden de publicacion.',
      en: 'The solo work of all four, in release order.',
      ko: '네 멤버의 솔로 활동을 발매 순서대로.',
    },
    items: [
      solo('jennie', 'jennie-solo'),
      solo('rose', 'rose-r'),
      solo('lisa', 'lisa-lalisa'),
      solo('jisoo', 'jisoo-me'),
      solo('lisa', 'lisa-rockstar'),
      solo('jennie', 'jennie-mantra'),
      solo('rose', 'rose-apt'),
      solo('rose', 'rose-rosie'),
    ],
  },

  {
    slug: 'b-sides',
    order: 5,
    basis: 'derived',
    title: { es: 'B-Sides', en: 'B-Sides', ko: '수록곡' },
    description: {
      es: 'Las canciones que nunca fueron single. Criterio comprobable: todo lo que no esta marcado como cancion principal.',
      en: 'The songs that were never a single. A checkable criterion: everything not marked as a title track.',
      ko: '싱글로 나온 적 없는 곡들. 타이틀곡으로 표시되지 않은 모든 곡이라는 확인 가능한 기준입니다.',
    },
    items: [
      track('square-two', 3),
      track('square-up', 2),
      track('square-up', 3),
      track('square-up', 4),
      track('kill-this-love', 2),
      track('kill-this-love', 3),
      track('kill-this-love', 4),
      track('the-album', 3),
      track('the-album', 4),
      track('the-album', 6),
      track('the-album', 7),
      track('the-album', 8),
      track('born-pink', 3),
      track('born-pink', 4),
      track('born-pink', 5),
      track('born-pink', 6),
      track('born-pink', 7),
      track('born-pink', 8),
    ],
  },

  {
    slug: 'para-bailar',
    order: 6,
    basis: 'curated',
    title: { es: 'Para Bailar', en: 'To Dance To', ko: '댄스' },
    description: {
      es: 'Las mas rapidas y con mas percusion del catalogo. Seleccion del sitio: el tempo no esta en los datos.',
      en: 'The fastest, most percussive songs in the catalogue. Our own pick: tempo is not in the data.',
      ko: '카탈로그에서 가장 빠르고 비트가 강한 곡들. 템포 정보가 데이터에 없어 사이트가 직접 고른 선곡입니다.',
    },
    items: [
      track('square-one', 2),
      track('square-up', 1),
      track('square-up', 3),
      track('kill-this-love', 1),
      track('kill-this-love', 3),
      track('the-album', 1),
      track('the-album', 3),
      track('the-album', 6),
      track('born-pink', 1),
      track('born-pink', 2),
      track('born-pink', 3),
      track('born-pink', 5),
    ],
  },
];

/** Busca una playlist por su slug. Devuelve undefined si no existe. */
export function findPlaylist(slug: string): PlaylistDefinition | undefined {
  return PLAYLISTS.find((playlist) => playlist.slug === slug);
}
