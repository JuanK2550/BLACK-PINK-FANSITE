// Definición de las playlists.

import type { Locale } from '@blackpink/types';

export type PlaylistItem =
  | { kind: 'track'; albumSlug: string; trackNumber: number }
  | { kind: 'solo'; memberSlug: string; soloWorkSlug: string };

export type PlaylistBasis = 'derived' | 'curated';

export interface PlaylistDefinition {
  slug: string;
  order: number;
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
      es: 'Todo lo publicado entre 2016 y 2017, en orden cronológico: los dos álbumes sencillos del debut y el sencillo que cerró esa etapa.',
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
    title: { es: 'Grandes Éxitos', en: 'Greatest Hits', ko: '대표곡' },
    description: {
      es: 'Todas las canciones principales del grupo, de 2016 a 2026. El criterio no es de gusto: son las marcadas como canción principal de su lanzamiento.',
      en: 'Every title track by the group, from 2016 to 2026. Not a matter of taste: these are the songs marked as the title track of their release.',
      ko: '2016년부터 2026년까지 그룹의 모든 타이틀곡. 취향이 아니라 각 발매작의 타이틀곡으로 표시된 곡들입니다.',
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
      track('the-girls', 1),
      track('deadline', 1),
      track('deadline', 2),
    ],
  },

  {
    slug: 'baladas',
    order: 3,
    basis: 'curated',
    title: { es: 'Baladas', en: 'Ballads', ko: '발라드' },
    description: {
      es: 'Las canciones de tempo lento del catálogo. Selección del sitio: no hay ningún dato en la ficha que clasifique una canción como balada.',
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
      es: 'Los sencillos, EP y álbumes en solitario de las cuatro, en orden de publicación. Las colaboraciones y bandas sonoras están en la ficha de cada una.',
      en: 'The solo singles, EPs and albums of all four, in release order. Collaborations and soundtracks are on each member page.',
      ko: '네 멤버의 솔로 싱글, EP, 앨범을 발매 순서대로. 컬래버레이션과 OST는 각 멤버 페이지에 있습니다.',
    },
    items: [
      solo('jennie', 'jennie-solo'),
      solo('rose', 'rose-r'),
      solo('lisa', 'lisa-lalisa'),
      solo('jisoo', 'jisoo-me'),
      solo('jennie', 'jennie-you-and-me'),
      solo('lisa', 'lisa-rockstar'),
      solo('jennie', 'jennie-mantra'),
      solo('rose', 'rose-rosie'),
      solo('jisoo', 'jisoo-amortage'),
      solo('lisa', 'lisa-alter-ego'),
      solo('jennie', 'jennie-ruby'),
      solo('jennie', 'jennie-ruby-complete'),
      solo('jennie', 'jennie-fallen-angel'),
      solo('jisoo', 'jisoo-click'),
      solo('rose', 'rose-new-trick'),
      solo('lisa', 'lisa-press-play'),
      solo('jisoo', 'jisoo-addicted'),
    ],
  },

  {
    slug: 'b-sides',
    order: 5,
    basis: 'derived',
    title: { es: 'B-Sides', en: 'B-Sides', ko: '수록곡' },
    description: {
      es: 'Las canciones que nunca fueron sencillo. Criterio comprobable: todo lo que no está marcado como canción principal.',
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
      track('kill-this-love', 5),
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
      track('deadline', 3),
      track('deadline', 4),
      track('deadline', 5),
    ],
  },

  {
    slug: 'para-bailar',
    order: 6,
    basis: 'curated',
    title: { es: 'Para Bailar', en: 'To Dance To', ko: '댄스' },
    description: {
      es: 'Las más rápidas y con más percusión del catálogo. Selección del sitio: el tempo no está en los datos.',
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
      track('deadline', 1),
      track('deadline', 2),
    ],
  },
];

export function findPlaylist(slug: string): PlaylistDefinition | undefined {
  return PLAYLISTS.find((playlist) => playlist.slug === slug);
}
