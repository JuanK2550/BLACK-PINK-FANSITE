// Trabajos en solitario de cada integrante con sus canciones.

import { day, SOURCES, type Translated } from './common';

export interface SoloTrackSeed {
  title: string;
  trackNumber: number;
  isTitleTrack?: boolean;
  featuring?: string;
  verified: boolean;
}

export interface SoloWorkSeed {
  slug: string;
  memberSlug: string;
  title: string;
  type: 'SINGLE' | 'EP' | 'ALBUM' | 'COLLABORATION' | 'OST' | 'OTHER';
  releaseDate: Date;
  verified: boolean;
  source: string;
  translations: {
    formatLabel: Translated;
    description: Translated;
  };
  tracks?: SoloTrackSeed[];
}

export const SOLO_WORKS: SoloWorkSeed[] = [
  {
    slug: 'jennie-solo',
    memberSlug: 'jennie',
    title: 'SOLO',
    type: 'SINGLE',
    releaseDate: day('2018-11-12'),
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'Sencillo', en: 'Single', ko: '싱글' },
      description: {
        es: 'Primer lanzamiento en solitario de una integrante de BLACKPINK.',
        en: 'The first solo release by a BLACKPINK member.',
        ko: 'BLACKPINK 멤버 중 최초의 솔로 음원.',
      },
    },
    tracks: [{ title: 'SOLO', trackNumber: 1, isTitleTrack: true, verified: true }],
  },
  {
    slug: 'rose-r',
    memberSlug: 'rose',
    title: 'R',
    type: 'SINGLE',
    releaseDate: day('2021-03-12'),
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'Álbum sencillo', en: 'Single album', ko: '싱글 앨범' },
      description: {
        es: 'Debut en solitario de Rose. Incluye On The Ground y Gone.',
        en: 'Rose solo debut. It includes On The Ground and Gone.',
        ko: '로제의 솔로 데뷔작. On The Ground와 Gone이 수록되어 있습니다.',
      },
    },
    tracks: [
      { title: 'On The Ground', trackNumber: 1, isTitleTrack: true, verified: true },
      { title: 'Gone', trackNumber: 2, isTitleTrack: true, verified: true },
    ],
  },
  {
    slug: 'lisa-lalisa',
    memberSlug: 'lisa',
    title: 'LALISA',
    type: 'SINGLE',
    releaseDate: day('2021-09-10'),
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'Álbum sencillo', en: 'Single album', ko: '싱글 앨범' },
      description: {
        es: 'Debut en solitario de Lisa. Incluye LALISA y MONEY.',
        en: 'Lisa solo debut. It includes LALISA and MONEY.',
        ko: '리사의 솔로 데뷔작. LALISA와 MONEY가 수록되어 있습니다.',
      },
    },
    tracks: [
      { title: 'LALISA', trackNumber: 1, isTitleTrack: true, verified: true },
      { title: 'MONEY', trackNumber: 2, verified: true },
    ],
  },
  {
    slug: 'jisoo-me',
    memberSlug: 'jisoo',
    title: 'ME',
    type: 'SINGLE',
    releaseDate: day('2023-03-31'),
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'Álbum sencillo', en: 'Single album', ko: '싱글 앨범' },
      description: {
        es: 'Debut en solitario de Jisoo. Su canción principal es FLOWER.',
        en: 'Jisoo solo debut. Its title track is FLOWER.',
        ko: '지수의 솔로 데뷔작. 타이틀곡은 FLOWER입니다.',
      },
    },
    tracks: [
      { title: 'FLOWER', trackNumber: 1, isTitleTrack: true, verified: true },
      { title: 'All Eyes On Me', trackNumber: 2, verified: true },
    ],
  },
  {
    slug: 'lisa-rockstar',
    memberSlug: 'lisa',
    title: 'ROCKSTAR',
    type: 'SINGLE',
    releaseDate: day('2024-06-28'),
    verified: true,
    source:
      'Wikipedia, Rockstar (Lisa song) — https://en.wikipedia.org/wiki/Rockstar_(Lisa_song). Publicada 2024-06-27 20:00 ET = 2024-06-28 09:00 KST. El proyecto adopta KST. Consultado 2026-08-29.',
    translations: {
      formatLabel: { es: 'Sencillo', en: 'Single', ko: '싱글' },
      description: {
        es: 'Sencillo en solitario de Lisa.',
        en: 'Lisa solo single.',
        ko: '리사의 솔로 싱글.',
      },
    },
    tracks: [{ title: 'Rockstar', trackNumber: 1, isTitleTrack: true, verified: true }],
  },
  {
    slug: 'jennie-mantra',
    memberSlug: 'jennie',
    title: 'Mantra',
    type: 'SINGLE',
    releaseDate: day('2024-10-11'),
    verified: true,
    source:
      'Wikipedia, Mantra (Jennie song) — https://en.wikipedia.org/wiki/Mantra_(Jennie_song). ' +
      'Confirmado también por nota de prensa de Sony Music. Consultado 2026-08-29. ' +
      'Nota: Spotify fecha el lanzamiento el 10-10-2024 —el mismo valor en todos los mercados— ' +
      'mientras que la fuente citada da el 11. El proyecto adopta KST y conserva el 11; ' +
      'es el mismo desfase de un día que en `lisa-rockstar`, no un error.',
    translations: {
      formatLabel: { es: 'Sencillo', en: 'Single', ko: '싱글' },
      description: {
        es: 'Sencillo en solitario de Jennie.',
        en: 'Jennie solo single.',
        ko: '제니의 솔로 싱글.',
      },
    },
    tracks: [{ title: 'Mantra', trackNumber: 1, isTitleTrack: true, verified: true }],
  },
  {
    slug: 'rose-apt',
    memberSlug: 'rose',
    title: 'APT.',
    type: 'COLLABORATION',
    releaseDate: day('2024-10-18'),
    verified: true,
    source:
      'Wikipedia, APT. (song) — https://en.wikipedia.org/wiki/APT._(song). Consultado 2026-08-29. Nota: la Wikipedia en español indica 17 de octubre; se adopta el 18 por consenso de fuentes en inglés.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Colaboración de Rose con Bruno Mars.',
        en: 'Rose collaboration with Bruno Mars.',
        ko: '로제와 브루노 마스의 컬래버레이션.',
      },
    },
    tracks: [
      {
        title: 'APT.',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'Bruno Mars',
        verified: true,
      },
    ],
  },
  {
    slug: 'rose-rosie',
    memberSlug: 'rose',
    title: 'rosie',
    type: 'ALBUM',
    releaseDate: day('2024-12-06'),
    verified: true,
    source:
      'Wikipedia, Rosie (Rosé album) — https://en.wikipedia.org/wiki/Rosie_(Ros%C3%A9_album). Consultado 2026-08-29.',
    translations: {
      formatLabel: { es: 'Álbum de estudio', en: 'Studio album', ko: '정규 앨범' },
      description: {
        es: 'Primer álbum en solitario de Rose.',
        en: 'Rose first solo album.',
        ko: '로제의 첫 솔로 정규 앨범.',
      },
    },
    tracks: [
      { title: 'number one girl', trackNumber: 1, isTitleTrack: true, verified: true },
      { title: '3am', trackNumber: 2, verified: true },
      { title: 'two years', trackNumber: 3, verified: true },
      { title: 'toxic till the end', trackNumber: 4, verified: true },
      { title: 'drinks or coffee', trackNumber: 5, verified: true },
      {
        title: 'APT.',
        trackNumber: 6,
        isTitleTrack: true,
        featuring: 'Bruno Mars',
        verified: true,
      },
      { title: 'gameboy', trackNumber: 7, verified: true },
      { title: 'stay a little longer', trackNumber: 8, verified: true },
      { title: 'not the same', trackNumber: 9, verified: true },
      { title: 'call it the end', trackNumber: 10, verified: true },
      { title: 'too bad for us', trackNumber: 11, verified: true },
      { title: 'dance all night', trackNumber: 12, verified: true },
    ],
  },
  {
    slug: 'jisoo-amortage',
    memberSlug: 'jisoo',
    title: 'AMORTAGE',
    type: 'EP',
    releaseDate: day('2025-02-14'),
    verified: true,
    source:
      'Wikipedia, Jisoo discography — https://en.wikipedia.org/wiki/Jisoo_discography. Publicado el 14-02-2025 por Blissoo y Warner Records. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'EP', en: 'EP', ko: '미니 앨범' },
      description: {
        es: 'Primer EP de Jisoo, publicado con su propio sello, Blissoo, y Warner Records. Sus sencillos son earthquake y Your Love.',
        en: 'Jisoo first EP, released through her own label Blissoo and Warner Records. Its singles are earthquake and Your Love.',
        ko: '지수가 자신의 레이블 블리수와 워너 레코드를 통해 발표한 첫 미니 앨범. 싱글은 earthquake와 Your Love입니다.',
      },
    },
    tracks: [
      { title: 'earthquake', trackNumber: 1, isTitleTrack: true, verified: true },
      { title: 'Your Love', trackNumber: 2, isTitleTrack: true, verified: true },
      { title: 'TEARS', trackNumber: 3, verified: true },
      { title: 'Hugs & Kisses', trackNumber: 4, verified: true },
    ],
  },
  {
    slug: 'jisoo-eyes-closed',
    memberSlug: 'jisoo',
    title: 'EYES CLOSED',
    type: 'COLLABORATION',
    releaseDate: day('2025-10-10'),
    verified: true,
    source:
      'Wikipedia, Jisoo discography — https://en.wikipedia.org/wiki/Jisoo_discography. Dueto con el cantante inglés ZAYN, publicado el 10-10-2025. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Dueto de Jisoo con el cantante inglés ZAYN.',
        en: 'Jisoo duet with English singer ZAYN.',
        ko: '지수와 영국 가수 제인의 듀엣곡.',
      },
    },
    tracks: [
      {
        title: 'EYES CLOSED',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'ZAYN',
        verified: true,
      },
    ],
  },
  {
    slug: 'jisoo-click',
    memberSlug: 'jisoo',
    title: 'CLICK',
    type: 'SINGLE',
    releaseDate: day('2026-09-04'),
    verified: true,
    source:
      'Wikipedia, Jisoo discography — https://en.wikipedia.org/wiki/Jisoo_discography. Sencillo publicado el 04-09-2026 por Blissoo y Warner Records. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Sencillo', en: 'Single', ko: '싱글' },
      description: {
        es: 'Sencillo de Jisoo, publicado con Blissoo y Warner Records.',
        en: 'Jisoo single, released through Blissoo and Warner Records.',
        ko: '블리수와 워너 레코드를 통해 발표한 지수의 싱글.',
      },
    },
    tracks: [{ title: 'CLICK', trackNumber: 1, isTitleTrack: true, verified: true }],
  },
  {
    slug: 'jennie-one-of-the-girls',
    memberSlug: 'jennie',
    title: 'One of the Girls',
    type: 'OST',
    releaseDate: day('2023-06-23'),
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Canción de The Weeknd, JENNIE y Lily-Rose Depp para la serie The Idol (HBO): salió el 23-06-2023 en la banda sonora del episodio 4 y como sencillo el 08-12-2023. Fecha de la banda sonora, según Spotify. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Banda sonora', en: 'Soundtrack', ko: 'OST' },
      description: {
        es: 'Canción de The Weeknd, Jennie y Lily-Rose Depp para la serie The Idol, de HBO.',
        en: 'Song by The Weeknd, Jennie and Lily-Rose Depp for the HBO series The Idol.',
        ko: 'HBO 드라마 디 아이돌을 위한 위켄드, 제니, 릴리로즈 뎁의 곡.',
      },
    },
    tracks: [
      {
        title: 'One of the Girls',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'The Weeknd, Lily-Rose Depp',
        verified: true,
      },
    ],
  },
  {
    slug: 'jennie-you-and-me',
    memberSlug: 'jennie',
    title: 'You & Me',
    type: 'SINGLE',
    releaseDate: day('2023-10-06'),
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Sencillo especial', en: 'Special single', ko: '스페셜 싱글' },
      description: {
        es: 'Sencillo especial de Jennie, con la versión de estudio y la de Coachella.',
        en: 'Jennie special single, with the studio version and the Coachella version.',
        ko: '스튜디오 버전과 코첼라 버전이 담긴 제니의 스페셜 싱글.',
      },
    },
    tracks: [
      { title: 'You & Me', trackNumber: 1, isTitleTrack: true, verified: true },
      { title: 'You & Me (Coachella ver.)', trackNumber: 2, verified: true },
    ],
  },
  {
    slug: 'jennie-slow-motion',
    memberSlug: 'jennie',
    title: 'Slow Motion',
    type: 'COLLABORATION',
    releaseDate: day('2024-03-08'),
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Colaboración con Matt Champion. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Colaboración de Jennie con Matt Champion.',
        en: 'Jennie collaboration with Matt Champion.',
        ko: '제니와 맷 챔피언의 컬래버레이션.',
      },
    },
    tracks: [
      {
        title: 'Slow Motion',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'Matt Champion',
        verified: true,
      },
    ],
  },
  {
    slug: 'jennie-spot',
    memberSlug: 'jennie',
    title: 'SPOT!',
    type: 'COLLABORATION',
    releaseDate: day('2024-04-26'),
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Canción de ZICO con JENNIE. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de ZICO con Jennie.',
        en: 'Song by ZICO with Jennie.',
        ko: '지코와 제니의 곡.',
      },
    },
    tracks: [
      { title: 'SPOT!', trackNumber: 1, isTitleTrack: true, featuring: 'ZICO', verified: true },
    ],
  },
  {
    slug: 'jennie-ruby',
    memberSlug: 'jennie',
    title: 'Ruby',
    type: 'ALBUM',
    releaseDate: day('2025-03-07'),
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Publicado el 07-03-2025 por Odd Atelier y Columbia Records. Se marcan como principales las canciones editadas también como sencillo. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Álbum de estudio', en: 'Studio album', ko: '정규 앨범' },
      description: {
        es: 'Primer álbum de estudio de Jennie, publicado con su sello Odd Atelier y Columbia Records.',
        en: 'Jennie first studio album, released through her label Odd Atelier and Columbia Records.',
        ko: '자신의 레이블 오드 아틀리에와 컬럼비아 레코드를 통해 발표한 제니의 첫 정규 앨범.',
      },
    },
    tracks: [
      { title: 'Intro : JANE with FKJ', trackNumber: 1, featuring: 'FKJ', verified: true },
      { title: 'like JENNIE', trackNumber: 2, isTitleTrack: true, verified: true },
      { title: 'start a war', trackNumber: 3, verified: true },
      {
        title: 'Handlebars',
        trackNumber: 4,
        isTitleTrack: true,
        featuring: 'Dua Lipa',
        verified: true,
      },
      { title: 'with the IE (way up)', trackNumber: 5, verified: true },
      { title: 'ExtraL', trackNumber: 6, isTitleTrack: true, featuring: 'Doechii', verified: true },
      { title: 'Mantra', trackNumber: 7, isTitleTrack: true, verified: true },
      {
        title: 'Love Hangover',
        trackNumber: 8,
        isTitleTrack: true,
        featuring: 'Dominic Fike',
        verified: true,
      },
      { title: 'ZEN', trackNumber: 9, verified: true },
      {
        title: 'Damn Right',
        trackNumber: 10,
        isTitleTrack: true,
        featuring: 'Childish Gambino, Kali Uchis',
        verified: true,
      },
      { title: 'F.T.S.', trackNumber: 11, verified: true },
      { title: 'Filter', trackNumber: 12, verified: true },
      { title: 'Seoul City', trackNumber: 13, verified: true },
      { title: 'Starlight', trackNumber: 14, verified: true },
      { title: 'twin', trackNumber: 15, verified: true },
    ],
  },
  {
    slug: 'jennie-dracula',
    memberSlug: 'jennie',
    title: 'Dracula',
    type: 'COLLABORATION',
    releaseDate: day('2026-02-06'),
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Versión de Dracula de Tame Impala con JENNIE. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Versión de Dracula, de Tame Impala, con Jennie.',
        en: 'Version of Tame Impala Dracula with Jennie.',
        ko: '제니가 참여한 테임 임팔라 Dracula의 버전.',
      },
    },
    tracks: [
      {
        title: 'Dracula',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'Tame Impala',
        verified: true,
      },
    ],
  },
  {
    slug: 'jennie-ruby-complete',
    memberSlug: 'jennie',
    title: 'Ruby (The Complete Collection)',
    type: 'ALBUM',
    releaseDate: day('2026-03-06'),
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Reedición de Ruby. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Reedición', en: 'Reissue', ko: '리이슈' },
      description: {
        es: 'Reedición de Ruby con las quince canciones originales y seis versiones nuevas, entre ellas remezclas y las versiones Just JENNIE.',
        en: 'Reissue of Ruby with the fifteen original songs and six new versions, including remixes and the Just JENNIE versions.',
        ko: '원곡 15곡과 리믹스, Just JENNIE 버전 등 새 버전 6곡을 담은 Ruby 리이슈.',
      },
    },
    tracks: [
      {
        title: 'like JENNIE - Extended Remix',
        trackNumber: 1,
        featuring: 'Diplo, d00mscrvll',
        verified: true,
      },
      { title: 'like JENNIE - EDM Remix', trackNumber: 2, featuring: 'Natural', verified: true },
      { title: 'Handlebars - Just JENNIE', trackNumber: 3, verified: true },
      { title: 'ExtraL - Just JENNIE', trackNumber: 4, verified: true },
      { title: 'Love Hangover - Just JENNIE', trackNumber: 5, verified: true },
      { title: 'Damn Right - Just JENNIE', trackNumber: 6, verified: true },
      { title: 'Intro : JANE with FKJ', trackNumber: 7, featuring: 'FKJ', verified: true },
      { title: 'like JENNIE', trackNumber: 8, verified: true },
      { title: 'start a war', trackNumber: 9, verified: true },
      { title: 'Handlebars', trackNumber: 10, featuring: 'Dua Lipa', verified: true },
      { title: 'with the IE (way up)', trackNumber: 11, verified: true },
      { title: 'ExtraL', trackNumber: 12, featuring: 'Doechii', verified: true },
      { title: 'Mantra', trackNumber: 13, verified: true },
      { title: 'Love Hangover', trackNumber: 14, featuring: 'Dominic Fike', verified: true },
      { title: 'ZEN', trackNumber: 15, verified: true },
      {
        title: 'Damn Right',
        trackNumber: 16,
        featuring: 'Childish Gambino, Kali Uchis',
        verified: true,
      },
      { title: 'F.T.S.', trackNumber: 17, verified: true },
      { title: 'Filter', trackNumber: 18, verified: true },
      { title: 'Seoul City', trackNumber: 19, verified: true },
      { title: 'Starlight', trackNumber: 20, verified: true },
      { title: 'twin', trackNumber: 21, verified: true },
    ],
  },
  {
    slug: 'jennie-fallen-angel',
    memberSlug: 'jennie',
    title: 'Fallen Angel',
    type: 'EP',
    releaseDate: day('2026-08-28'),
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. EP publicado el 28-08-2026 por Odd Atelier y Columbia. Less than a Lover se adelantó como sencillo el 24-07-2026. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'EP', en: 'EP', ko: '미니 앨범' },
      description: {
        es: 'EP de Jennie, publicado con Odd Atelier y Columbia. Less than a Lover se adelantó como sencillo.',
        en: 'Jennie EP, released through Odd Atelier and Columbia. Less than a Lover came out first as a single.',
        ko: '오드 아틀리에와 컬럼비아를 통해 발표한 제니의 미니 앨범. Less than a Lover가 선공개 싱글로 먼저 나왔습니다.',
      },
    },
    tracks: [
      { title: 'FALLEN ANGEL', trackNumber: 1, verified: true },
      { title: 'HEAVEN', trackNumber: 2, verified: true },
      { title: 'Less than a Lover', trackNumber: 3, isTitleTrack: true, verified: true },
    ],
  },
  {
    slug: 'rose-messy',
    memberSlug: 'rose',
    title: 'Messy',
    type: 'OST',
    releaseDate: day('2025-05-08'),
    verified: true,
    source:
      'Wikipedia, Rosé discography — https://en.wikipedia.org/wiki/Ros%C3%A9_discography. Canción de F1 The Album, banda sonora de la película F1. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Banda sonora', en: 'Soundtrack', ko: 'OST' },
      description: {
        es: 'Canción de Rosé para la banda sonora de la película F1.',
        en: 'Rosé song for the soundtrack of the film F1.',
        ko: '영화 F1 사운드트랙에 수록된 로제의 곡.',
      },
    },
    tracks: [{ title: 'Messy', trackNumber: 1, isTitleTrack: true, verified: true }],
  },
  {
    slug: 'rose-on-my-mind',
    memberSlug: 'rose',
    title: 'On My Mind',
    type: 'COLLABORATION',
    releaseDate: day('2025-06-27'),
    verified: true,
    source:
      "Wikipedia, Rosé discography — https://en.wikipedia.org/wiki/Ros%C3%A9_discography. Canción de Alex Warren con ROSÉ, del álbum You'll Be Alright, Kid. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.",
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de Alex Warren con Rosé.',
        en: 'Song by Alex Warren with Rosé.',
        ko: '알렉스 워렌과 로제의 곡.',
      },
    },
    tracks: [
      {
        title: 'On My Mind',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'Alex Warren',
        verified: true,
      },
    ],
  },
  {
    slug: 'lisa-sg',
    memberSlug: 'lisa',
    title: 'SG',
    type: 'COLLABORATION',
    releaseDate: day('2021-10-22'),
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Canción de DJ Snake con Ozuna, Megan Thee Stallion y LISA. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de DJ Snake con Ozuna, Megan Thee Stallion y Lisa.',
        en: 'Song by DJ Snake with Ozuna, Megan Thee Stallion and Lisa.',
        ko: 'DJ 스네이크, 오주나, 메건 더 스탤리언, 리사의 곡.',
      },
    },
    tracks: [
      {
        title: 'SG',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'DJ Snake, Ozuna, Megan Thee Stallion',
        verified: true,
      },
    ],
  },
  {
    slug: 'lisa-alter-ego',
    memberSlug: 'lisa',
    title: 'Alter Ego',
    type: 'ALBUM',
    releaseDate: day('2025-02-28'),
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Publicado el 28-02-2025 por Lloud y RCA Records. Se marcan como principales las canciones editadas también como sencillo. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Álbum de estudio', en: 'Studio album', ko: '정규 앨범' },
      description: {
        es: 'Primer álbum de estudio de Lisa, publicado con su sello Lloud y RCA Records.',
        en: 'Lisa first studio album, released through her label Lloud and RCA Records.',
        ko: '자신의 레이블 라우드와 RCA 레코드를 통해 발표한 리사의 첫 정규 앨범.',
      },
    },
    tracks: [
      {
        title: 'Born Again',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'Doja Cat, RAYE',
        verified: true,
      },
      { title: 'Rockstar', trackNumber: 2, isTitleTrack: true, verified: true },
      { title: 'Elastigirl', trackNumber: 3, verified: true },
      { title: 'Thunder', trackNumber: 4, verified: true },
      {
        title: 'New Woman',
        trackNumber: 5,
        isTitleTrack: true,
        featuring: 'ROSALÍA',
        verified: true,
      },
      {
        title: 'FXCK UP THE WORLD',
        trackNumber: 6,
        isTitleTrack: true,
        featuring: 'Future',
        verified: true,
      },
      { title: 'Rapunzel', trackNumber: 7, featuring: 'Megan Thee Stallion', verified: true },
      { title: 'Moonlit Floor (Kiss Me)', trackNumber: 8, isTitleTrack: true, verified: true },
      { title: "When I'm With You", trackNumber: 9, featuring: 'Tyla', verified: true },
      { title: 'BADGRRRL', trackNumber: 10, verified: true },
      { title: 'Lifestyle', trackNumber: 11, verified: true },
      { title: 'Chill', trackNumber: 12, verified: true },
      { title: 'Dream', trackNumber: 13, verified: true },
      { title: 'FXCK UP THE WORLD (Vixi Solo Version)', trackNumber: 14, verified: true },
      { title: 'Rapunzel (Kiki Solo Version)', trackNumber: 15, verified: true },
    ],
  },
  {
    slug: 'lisa-priceless',
    memberSlug: 'lisa',
    title: 'Priceless',
    type: 'COLLABORATION',
    releaseDate: day('2025-05-02'),
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Canción de Maroon 5 con LISA. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de Maroon 5 con Lisa.',
        en: 'Song by Maroon 5 featuring Lisa.',
        ko: '마룬 5와 리사의 곡.',
      },
    },
    tracks: [
      {
        title: 'Priceless',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'Maroon 5',
        verified: true,
      },
    ],
  },
  {
    slug: 'lisa-bad-angel',
    memberSlug: 'lisa',
    title: 'Bad Angel',
    type: 'COLLABORATION',
    releaseDate: day('2026-04-08'),
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Canción de Anyma con LISA. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de Anyma con Lisa.',
        en: 'Song by Anyma with Lisa.',
        ko: '애니마와 리사의 곡.',
      },
    },
    tracks: [
      {
        title: 'Bad Angel',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'Anyma',
        verified: true,
      },
    ],
  },
  {
    slug: 'lisa-goals',
    memberSlug: 'lisa',
    title: 'Goals',
    type: 'COLLABORATION',
    releaseDate: day('2026-05-21'),
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Canción de LISA con Anitta y Rema para la Copa Mundial de la FIFA 2026. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de Lisa con Anitta y Rema para la Copa Mundial de la FIFA 2026.',
        en: 'Song by Lisa with Anitta and Rema for the 2026 FIFA World Cup.',
        ko: '2026 FIFA 월드컵을 위한 리사, 아니타, 레마의 곡.',
      },
    },
    tracks: [
      {
        title: 'Goals',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'Anitta, Rema',
        verified: true,
      },
    ],
  },
  {
    slug: 'lisa-sawadika',
    memberSlug: 'lisa',
    title: 'SaWaDiKa',
    type: 'SINGLE',
    releaseDate: day('2026-09-02'),
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Sencillo de 2026. La fuente escrita solo da el año: la fecha es la de la ficha de Spotify. Sin conversión a KST contrastada; es un lanzamiento occidental de viernes o de hora coreana, que en los dos casos cae el mismo día en KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Sencillo', en: 'Single', ko: '싱글' },
      description: {
        es: 'Sencillo de Lisa.',
        en: 'Lisa single.',
        ko: '리사의 싱글.',
      },
    },
    tracks: [{ title: 'SaWaDiKa', trackNumber: 1, isTitleTrack: true, verified: true }],
  },
  {
    slug: 'rose-without-you',
    memberSlug: 'rose',
    title: 'Without You',
    type: 'COLLABORATION',
    releaseDate: day('2012-09-18'),
    verified: true,
    source:
      'Wikipedia, One of a Kind (G-Dragon EP) — https://en.wikipedia.org/wiki/One_of_a_Kind_(G-Dragon_EP). Pista 3, «Without You» (결국), con Rosé; 4:03. EP publicado en digital el 15-09-2012 y en físico el 18-09-2012 por YG Entertainment: el proyecto registra la física. Al anunciarse, la voz se acreditó como «? from YG New Girl Group»; se supo que era Rosé cuatro años después. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de G-Dragon con Rosé, cuatro años antes del debut. Entonces se la acreditó como una voz misteriosa del futuro grupo de chicas de YG.',
        en: "Song by G-Dragon featuring Rosé, four years before the debut. At the time she was credited as a mystery voice from YG's upcoming girl group.",
        ko: '데뷔 4년 전에 발표된 지드래곤과 로제의 곡. 당시에는 YG 신인 걸그룹의 비밀 멤버로만 소개되었습니다.',
      },
    },
    tracks: [
      {
        title: 'Without You',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'G-DRAGON',
        verified: true,
      },
    ],
  },
  {
    slug: 'jennie-special',
    memberSlug: 'jennie',
    title: 'Special',
    type: 'COLLABORATION',
    releaseDate: day('2013-03-07'),
    verified: true,
    source:
      'Wikipedia, First Love (Lee Hi album) — https://en.wikipedia.org/wiki/First_Love_(Lee_Hi_album). «Special» (featuring Jennie), pista 2; 3:56. Salió el 07-03-2013 en la primera parte, un mini álbum solo digital con las cinco primeras canciones; el álbum completo salió en digital el 28-03-2013 (la fecha que da Spotify) y en CD el 02-04-2013. Se fecha la primera publicación: esa primera parte no tuvo edición física propia. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de Lee Hi con Jennie, publicada tres años antes del debut de BLACKPINK.',
        en: 'Song by Lee Hi featuring Jennie, released three years before BLACKPINK debuted.',
        ko: 'BLACKPINK 데뷔 3년 전에 발표된 이하이와 제니의 곡.',
      },
    },
    tracks: [
      {
        title: 'Special',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'LEEHI',
        verified: true,
      },
    ],
  },
  {
    slug: 'jennie-gg-be',
    memberSlug: 'jennie',
    title: 'GG Be',
    type: 'COLLABORATION',
    releaseDate: day('2013-08-19'),
    verified: true,
    source:
      "Wikipedia, Seungri discography — https://en.wikipedia.org/wiki/Seungri_discography. «GG Be» (지지베) (featuring Jennie of Blackpink), del EP Let's Talk About Love, publicado el 19-08-2013. Consultado 2026-09-11.",
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: "Canción de Seungri con Jennie, del EP Let's Talk About Love.",
        en: "Song by Seungri featuring Jennie, from the EP Let's Talk About Love.",
        ko: "승리의 미니 앨범 LET'S TALK ABOUT LOVE에 수록된 승리와 제니의 곡 「지지베」.",
      },
    },
    tracks: [
      {
        title: 'GG Be',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'SEUNGRI',
        verified: true,
      },
    ],
  },
  {
    slug: 'jennie-black',
    memberSlug: 'jennie',
    title: 'Black',
    type: 'COLLABORATION',
    releaseDate: day('2013-09-02'),
    verified: true,
    source:
      "Wikipedia, Coup d'Etat (G-Dragon album) — https://en.wikipedia.org/wiki/Coup_d%27Etat_(G-Dragon_album). «Black» fue uno de los dos primeros sencillos, publicados el 02-09-2013 con la parte 1 del álbum; la parte 2 salió el 05-09-2013 (la fecha que da Spotify) y el CD el 13-09-2013. La pista acredita a Jennie como «Jennie Kim of YG New Girl Group». Consultado 2026-09-11.",
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de G-Dragon con Jennie, cuando aún era aprendiz de YG: se la acreditó como Jennie Kim, del futuro grupo de chicas de la agencia.',
        en: "Song by G-Dragon featuring Jennie, while she was still a YG trainee: she was credited as Jennie Kim of the agency's upcoming girl group.",
        ko: '제니가 YG 연습생이던 시절에 발표된 지드래곤과 제니의 곡. 당시에는 YG 신인 걸그룹의 제니 김으로 소개되었습니다.',
      },
    },
    tracks: [
      {
        title: 'Black',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'G-DRAGON',
        verified: true,
      },
    ],
  },
  {
    slug: 'lisa-shoong',
    memberSlug: 'lisa',
    title: 'Shoong!',
    type: 'COLLABORATION',
    releaseDate: day('2023-04-25'),
    verified: true,
    source:
      'Wikipedia, Shoong! — https://en.wikipedia.org/wiki/Shoong!. Canción de Taeyang con Lisa, publicada el 25-04-2023 por The Black Label como segunda pista del EP Down to Earth; 3:25. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Colaboración', en: 'Collaboration', ko: '컬래버레이션' },
      description: {
        es: 'Canción de Taeyang con Lisa, del EP Down to Earth.',
        en: 'Song by Taeyang featuring Lisa, from the EP Down to Earth.',
        ko: '태양의 미니 앨범 Down to Earth에 수록된 태양과 리사의 곡.',
      },
    },
    tracks: [
      {
        title: 'Shoong!',
        trackNumber: 1,
        isTitleTrack: true,
        featuring: 'TAEYANG',
        verified: true,
      },
    ],
  },
];
