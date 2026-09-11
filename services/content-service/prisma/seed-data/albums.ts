import { day, SOURCES, type Translated } from './common';

export interface TrackSeed {
  title: string;
  trackNumber: number;
  isTitleTrack?: boolean;
  /** Titulo en otros idiomas. Solo se rellena cuando se conoce con certeza. */
  titleLocalized?: Record<string, string>;
  verified: boolean;
}

export interface AlbumSeed {
  slug: string;
  title: string;
  type: 'SINGLE' | 'EP' | 'ALBUM' | 'COMPILATION' | 'COLLABORATION';
  releaseDate: Date;
  label: string;
  verified: boolean;
  source: string;
  translations: {
    formatLabel: Translated;
    description: Translated;
  };
  tracks: TrackSeed[];
}

/**
 * Discografia principal del grupo, del lanzamiento mas antiguo al mas reciente.
 *
 * LO QUE NO SE RELLENA A PROPOSITO:
 *
 * - `durationSec` de cada pista. No hay una fuente fiable a mano y una
 *   duracion inventada es peor que un hueco: la rellenara media-service en la
 *   Fase 5 leyendo la API oficial.
 * - `spotifyId` y `youtubeId`. Mismo motivo. Ademas son la puerta a los
 *   reproductores oficiales: un identificador equivocado lleva a contenido
 *   equivocado.
 * - `coverUrl`. Este fichero no la lleva, pero el sitio SI muestra portadas:
 *   las resuelve `infra/scripts/spotify-covers.mjs` y se guardan en
 *   `seed-data/spotify-covers.json`. Se ENLAZAN a la CDN de Spotify, nunca se
 *   alojan. Van aparte porque este fichero son afirmaciones de una persona y
 *   una portada es el hallazgo de un script.
 *
 * Las pistas de los dos lanzamientos japoneses son las de la edicion DIGITAL
 * (Fase 14), y su `source` lo dice: la fisica puede traer versiones que no
 * estan en la digital.
 *
 * `COLLABORATION` es una cancion del grupo en el disco de OTRO artista (Kiss
 * and Make Up, Sour Candy). Va aqui y no en las obras en solitario porque es
 * del grupo, y con su propio tipo porque NO es un sencillo de BLACKPINK: con
 * `SINGLE`, el filtro de la discografia la contaria como tal.
 */
export const ALBUMS: AlbumSeed[] = [
  {
    slug: 'square-one',
    title: 'SQUARE ONE',
    type: 'SINGLE',
    releaseDate: day('2016-08-08'),
    label: 'YG Entertainment',
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'Álbum sencillo, debut', en: 'Single album, debut', ko: '데뷔 싱글 앨범' },
      description: {
        es: 'El álbum sencillo de debut. Salió con dos canciones principales a la vez.',
        en: 'The debut single album. It was released with two title tracks at once.',
        ko: '데뷔 싱글 앨범. 더블 타이틀곡으로 발표되었습니다.',
      },
    },
    tracks: [
      {
        title: 'Whistle',
        trackNumber: 1,
        isTitleTrack: true,
        titleLocalized: { ko: '휘파람' },
        verified: true,
      },
      {
        title: 'Boombayah',
        trackNumber: 2,
        isTitleTrack: true,
        titleLocalized: { ko: '붐바야' },
        verified: true,
      },
    ],
  },
  {
    slug: 'square-two',
    title: 'SQUARE TWO',
    type: 'SINGLE',
    releaseDate: day('2016-11-01'),
    label: 'YG Entertainment',
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'Álbum sencillo', en: 'Single album', ko: '싱글 앨범' },
      description: {
        es: 'Segundo álbum sencillo, publicado el mismo año del debut.',
        en: 'Second single album, released in the same year as the debut.',
        ko: '데뷔와 같은 해에 발표한 두 번째 싱글 앨범.',
      },
    },
    tracks: [
      {
        title: 'Playing with Fire',
        trackNumber: 1,
        isTitleTrack: true,
        titleLocalized: { ko: '불장난' },
        verified: true,
      },
      { title: 'Stay', trackNumber: 2, isTitleTrack: true, verified: true },
      { title: 'Whistle (Acoustic Ver.)', trackNumber: 3, verified: true },
    ],
  },
  {
    slug: 'as-if-its-your-last',
    title: "As If It's Your Last",
    type: 'SINGLE',
    releaseDate: day('2017-06-22'),
    label: 'YG Entertainment',
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'Sencillo', en: 'Single', ko: '싱글' },
      description: {
        es: 'Sencillo digital publicado en 2017, entre SQUARE TWO y SQUARE UP.',
        en: 'Digital single released in 2017, between SQUARE TWO and SQUARE UP.',
        ko: 'SQUARE TWO와 SQUARE UP 사이인 2017년에 발표한 디지털 싱글.',
      },
    },
    tracks: [
      {
        title: "As If It's Your Last",
        trackNumber: 1,
        isTitleTrack: true,
        titleLocalized: { ko: '마지막처럼' },
        verified: true,
      },
    ],
  },
  {
    slug: 'blackpink-japanese-mini',
    title: 'BLACKPINK (Japanese Mini Album)',
    // EP y no SINGLE: Spotify lo clasifica como `single`, pero con seis pistas
    // es un extended play. La laxitud de Spotify entre single y EP es conocida
    // y aqui no decide.
    type: 'EP',
    // Fecha FISICA. La digital fue el 29; ver el criterio en `source`.
    releaseDate: day('2017-08-30'),
    label: 'YGEX',
    verified: true,
    source:
      'Wikipedia, Blackpink (EP) - https://en.wikipedia.org/wiki/Blackpink_(EP). ' +
      'Publicado digitalmente el 29-08-2017 y fisicamente el 30-08-2017 por YGEX; ' +
      'el proyecto registra la fecha fisica. Consultado 2026-08-30. ' +
      'Lista de canciones: la de la edicion DIGITAL en Spotify (consultado 2026-09-11); ' +
      'la edicion fisica japonesa puede traer versiones que no estan en la digital.',
    translations: {
      formatLabel: { es: 'Mini álbum japonés', en: 'Japanese mini album', ko: '일본 미니 앨범' },
      description: {
        es: 'Debut en el mercado japonés, con versiones en japonés de sus primeros éxitos.',
        en: 'Debut in the Japanese market, with Japanese versions of their early hits.',
        ko: '초기 히트곡의 일본어 버전을 담은 일본 데뷔작.',
      },
    },
    tracks: [
      { title: 'BOOMBAYAH (Japanese Version)', trackNumber: 1, verified: true },
      { title: 'WHISTLE (Japanese Version)', trackNumber: 2, verified: true },
      { title: 'PLAYING WITH FIRE (Japanese Version)', trackNumber: 3, verified: true },
      { title: 'STAY (Japanese Version)', trackNumber: 4, verified: true },
      { title: "AS IF IT'S YOUR LAST (Japanese Version)", trackNumber: 5, verified: true },
      { title: 'WHISTLE (Acoustic Ver.) (Japanese Version)', trackNumber: 6, verified: true },
    ],
  },
  {
    slug: 'square-up',
    title: 'SQUARE UP',
    type: 'EP',
    releaseDate: day('2018-06-15'),
    label: 'YG Entertainment',
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'EP', en: 'EP', ko: '미니 앨범' },
      description: {
        es: 'Primer EP del grupo. Incluye DDU-DU DDU-DU.',
        en: 'The group first EP. It includes DDU-DU DDU-DU.',
        ko: '그룹의 첫 미니 앨범. DDU-DU DDU-DU가 수록되어 있습니다.',
      },
    },
    tracks: [
      {
        title: 'DDU-DU DDU-DU',
        trackNumber: 1,
        isTitleTrack: true,
        titleLocalized: { ko: '뚜두뚜두' },
        verified: true,
      },
      { title: 'Forever Young', trackNumber: 2, verified: true },
      { title: 'Really', trackNumber: 3, verified: true },
      { title: 'See U Later', trackNumber: 4, verified: true },
    ],
  },
  {
    slug: 'blackpink-in-your-area',
    title: 'BLACKPINK IN YOUR AREA',
    // COMPILATION, no ALBUM. Reune las canciones publicadas hasta la fecha
    // -el EP japones y SQUARE UP incluidos-, asi que no es material nuevo.
    // Es la primera fila del catalogo que usa este tipo; existia en el esquema
    // desde la Fase 3 sin que nada lo utilizara.
    type: 'COMPILATION',
    // Fecha FISICA en Japon. La digital fue el 23-11; ver `source`.
    releaseDate: day('2018-12-05'),
    label: 'YGEX',
    verified: true,
    source:
      'Wikipedia, Blackpink in Your Area - https://en.wikipedia.org/wiki/Blackpink_in_Your_Area. ' +
      'Album recopilatorio publicado digitalmente el 23-11-2018 y fisicamente en Japon ' +
      'el 05-12-2018 por YGEX; el proyecto registra la fecha fisica. Consultado 2026-08-30. ' +
      'Lista de canciones: la de la edicion DIGITAL en Spotify (consultado 2026-09-11); ' +
      'la edicion fisica japonesa puede traer versiones que no estan en la digital.',
    translations: {
      formatLabel: {
        es: 'Recopilatorio japonés',
        en: 'Japanese compilation',
        ko: '일본 컴필레이션 앨범',
      },
      description: {
        es: 'Recopilatorio japonés: reune las canciones publicadas hasta 2018.',
        en: 'Japanese compilation: it gathers the songs released up to 2018.',
        ko: '2018년까지 발표한 곡을 모은 일본 컴필레이션 앨범.',
      },
    },
    tracks: [
      { title: 'BOOMBAYAH (Japanese Version)', trackNumber: 1, verified: true },
      { title: 'WHISTLE (Japanese Version)', trackNumber: 2, verified: true },
      { title: 'PLAYING WITH FIRE (Japanese Version)', trackNumber: 3, verified: true },
      { title: 'STAY (Japanese Version)', trackNumber: 4, verified: true },
      { title: "AS IF IT'S YOUR LAST (Japanese Version)", trackNumber: 5, verified: true },
      { title: 'DDU-DU DDU-DU (Japanese Version)', trackNumber: 6, verified: true },
      { title: 'FOREVER YOUNG (Japanese Version)', trackNumber: 7, verified: true },
      { title: 'REALLY (Japanese Version)', trackNumber: 8, verified: true },
      { title: 'SEE U LATER (Japanese Version)', trackNumber: 9, verified: true },
    ],
  },
  {
    slug: 'kill-this-love',
    title: 'KILL THIS LOVE',
    type: 'EP',
    releaseDate: day('2019-04-05'),
    label: 'YG Entertainment',
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'EP', en: 'EP', ko: '미니 앨범' },
      description: {
        es: 'Segundo EP. Salió una semana antes de su primera actuación en Coachella.',
        en: 'Second EP. It came out a week before their first Coachella performance.',
        ko: '두 번째 미니 앨범. 첫 코첼라 무대 일주일 전에 발표되었습니다.',
      },
    },
    tracks: [
      { title: 'Kill This Love', trackNumber: 1, isTitleTrack: true, verified: true },
      { title: "Don't Know What To Do", trackNumber: 2, verified: true },
      { title: 'Kick It', trackNumber: 3, verified: true },
      { title: 'Hope Not', trackNumber: 4, titleLocalized: { ko: '아니길' }, verified: true },
      { title: 'DDU-DU DDU-DU (Remix)', trackNumber: 5, verified: true },
    ],
  },
  {
    slug: 'the-album',
    title: 'THE ALBUM',
    type: 'ALBUM',
    releaseDate: day('2020-10-02'),
    label: 'YG Entertainment / Interscope Records',
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'Álbum de estudio', en: 'Studio album', ko: '정규 앨범' },
      description: {
        es: 'Primer álbum de estudio completo en coreano, cuatro años después del debut.',
        en: 'First full-length Korean studio album, four years after the debut.',
        ko: '데뷔 4년 만에 발표한 첫 한국어 정규 앨범.',
      },
    },
    tracks: [
      { title: 'How You Like That', trackNumber: 1, isTitleTrack: true, verified: true },
      {
        title: 'Ice Cream (with Selena Gomez)',
        trackNumber: 2,
        isTitleTrack: true,
        verified: true,
      },
      { title: 'Pretty Savage', trackNumber: 3, verified: true },
      { title: 'Bet You Wanna (feat. Cardi B)', trackNumber: 4, verified: true },
      { title: 'Lovesick Girls', trackNumber: 5, isTitleTrack: true, verified: true },
      { title: 'Crazy Over You', trackNumber: 6, verified: true },
      { title: 'Love To Hate Me', trackNumber: 7, verified: true },
      { title: 'You Never Know', trackNumber: 8, verified: true },
    ],
  },
  {
    slug: 'born-pink',
    title: 'BORN PINK',
    type: 'ALBUM',
    releaseDate: day('2022-09-16'),
    label: 'YG Entertainment / Interscope Records',
    verified: true,
    source: SOURCES.discography,
    translations: {
      formatLabel: { es: 'Álbum de estudio', en: 'Studio album', ko: '정규 앨범' },
      description: {
        es: 'Segundo álbum de estudio. Salió con dos canciones principales, Pink Venom y Shut Down.',
        en: 'Second studio album. It was released with two title tracks, Pink Venom and Shut Down.',
        ko: '두 번째 정규 앨범. Pink Venom과 Shut Down의 더블 타이틀로 발표되었습니다.',
      },
    },
    tracks: [
      { title: 'Pink Venom', trackNumber: 1, isTitleTrack: true, verified: true },
      { title: 'Shut Down', trackNumber: 2, isTitleTrack: true, verified: true },
      { title: 'Typa Girl', trackNumber: 3, verified: true },
      { title: 'Yeah Yeah Yeah', trackNumber: 4, verified: true },
      { title: 'Hard to Love', trackNumber: 5, verified: true },
      { title: 'The Happiest Girl', trackNumber: 6, verified: true },
      { title: 'Tally', trackNumber: 7, verified: true },
      { title: 'Ready For Love', trackNumber: 8, verified: true },
    ],
  },
  {
    slug: 'the-girls',
    title: 'THE GIRLS',
    type: 'SINGLE',
    releaseDate: day('2023-08-25'),
    label: 'YG Entertainment',
    verified: true,
    source:
      'Banda sonora del videojuego BLACKPINK THE GAME. Fecha: ficha oficial en Spotify (25-08-2023). Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'Sencillo (banda sonora)', en: 'Single (soundtrack)', ko: '싱글 (OST)' },
      description: {
        es: 'Canción del grupo para la banda sonora del videojuego BLACKPINK THE GAME.',
        en: 'Group song for the soundtrack of the video game BLACKPINK THE GAME.',
        ko: '게임 BLACKPINK THE GAME의 OST로 발표된 그룹의 곡.',
      },
    },
    tracks: [{ title: 'THE GIRLS', trackNumber: 1, isTitleTrack: true, verified: true }],
  },
  {
    slug: 'deadline',
    title: 'DEADLINE',
    type: 'EP',
    releaseDate: day('2026-02-27'),
    label: 'YG Entertainment',
    verified: true,
    source:
      'Wikipedia, Deadline (EP) — https://en.wikipedia.org/wiki/Deadline_(EP). Tercer EP coreano (cuarto en total), publicado el 27-02-2026 por YG Entertainment; JUMP se adelantó como sencillo el 11-07-2025 y GO es la canción principal. Spotify lo lista también con fecha 26-02-2026, que es el mismo lanzamiento en otro huso; el proyecto adopta KST. Lista de canciones, duraciones e identificadores: ficha oficial en Spotify. Consultado 2026-09-11.',
    translations: {
      formatLabel: { es: 'EP', en: 'EP', ko: '미니 앨범' },
      description: {
        es: 'Tercer EP coreano del grupo. JUMP se adelantó como sencillo en julio de 2025, y GO es la canción principal.',
        en: 'The group third Korean EP. JUMP came out first as a single in July 2025, and GO is the title track.',
        ko: '그룹의 세 번째 한국 미니 앨범. 2025년 7월 JUMP가 선공개 싱글로 먼저 나왔고, 타이틀곡은 GO입니다.',
      },
    },
    tracks: [
      {
        title: 'JUMP',
        trackNumber: 1,
        isTitleTrack: true,
        titleLocalized: { ko: '뛰어' },
        verified: true,
      },
      { title: 'GO', trackNumber: 2, isTitleTrack: true, verified: true },
      { title: 'Me and my', trackNumber: 3, verified: true },
      { title: 'Champion', trackNumber: 4, verified: true },
      { title: 'Fxxxboy', trackNumber: 5, verified: true },
    ],
  },
  {
    slug: 'kiss-and-make-up',
    title: 'Kiss and Make Up',
    type: 'COLLABORATION',
    releaseDate: day('2018-10-19'),
    label: 'Warner Bros. Records',
    verified: true,
    source:
      'Wikipedia, Kiss and Make Up (Dua Lipa and Blackpink song) — https://en.wikipedia.org/wiki/Kiss_and_Make_Up_(Dua_Lipa_and_Blackpink_song). Canción de Dua Lipa con BLACKPINK, publicada el 19-10-2018 como último sencillo promocional junto a la reedición Dua Lipa: Complete Edition, donde es la pista 3 del segundo disco; 3:09. Un lanzamiento occidental de medianoche local: en KST cae el mismo día. Consultado 2026-09-11.',
    translations: {
      formatLabel: {
        es: 'Colaboración · sencillo promocional',
        en: 'Collaboration · promotional single',
        ko: '컬래버레이션 · 프로모션 싱글',
      },
      description: {
        es: 'Canción de Dua Lipa con BLACKPINK, incluida en la reedición Dua Lipa: Complete Edition.',
        en: 'Song by Dua Lipa with BLACKPINK, included on the reissue Dua Lipa: Complete Edition.',
        ko: '두아 리파와 BLACKPINK의 곡. 리패키지 앨범 Dua Lipa: Complete Edition에 수록되었습니다.',
      },
    },
    tracks: [{ title: 'Kiss and Make Up', trackNumber: 1, isTitleTrack: true, verified: true }],
  },
  {
    slug: 'sour-candy',
    title: 'Sour Candy',
    type: 'COLLABORATION',
    // La fecha del sencillo promocional, no la del álbum Chromatica (29-05-2020),
    // que es la que da Spotify porque allí solo existe dentro del álbum.
    releaseDate: day('2020-05-28'),
    label: 'Interscope Records',
    verified: true,
    source:
      "Wikipedia, Sour Candy (Lady Gaga and Blackpink song) — https://en.wikipedia.org/wiki/Sour_Candy_(Lady_Gaga_and_Blackpink_song). «It was released for digital download and streaming on May 28, 2020, as a promotional single off Gaga's sixth studio album, Chromatica»; 2:37. La fuente no da la hora, así que no se convierte a KST: se guarda el día que da. Spotify la fecha el 29-05-2020 porque solo la tiene dentro del álbum. Consultado 2026-09-11.",
    translations: {
      formatLabel: {
        es: 'Colaboración · sencillo promocional',
        en: 'Collaboration · promotional single',
        ko: '컬래버레이션 · 프로모션 싱글',
      },
      description: {
        es: 'Canción de Lady Gaga con BLACKPINK, del álbum Chromatica.',
        en: 'Song by Lady Gaga with BLACKPINK, from the album Chromatica.',
        ko: '레이디 가가와 BLACKPINK의 곡. 앨범 Chromatica에 수록되었습니다.',
      },
    },
    tracks: [{ title: 'Sour Candy', trackNumber: 1, isTitleTrack: true, verified: true }],
  },
];
