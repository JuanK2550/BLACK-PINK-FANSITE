// Premios y nominaciones.

import type { Translated } from './common';

export interface AwardSeed {
  name: string;
  category: string;
  year: number;
  organization: string;
  work: string | null;
  won: boolean;
  verified: boolean;
  source: string;
  translations: {
    name?: Translated;
    category: Translated;
  };
}

const FUENTE =
  'Wikipedia, List of awards and nominations received by Blackpink — https://en.wikipedia.org/wiki/List_of_awards_and_nominations_received_by_Blackpink. Consultado 2026-08-29. El ano registrado es el de la ceremonia, no el de la obra premiada.';

const CATEGORIES = {
  rookie: { es: 'Revelación', en: 'New artist', ko: '신인상' },
  bonsang: { es: 'Premio principal (bonsang)', en: 'Main prize (bonsang)', ko: '본상' },
  daesang: { es: 'Gran premio (daesang)', en: 'Grand prize (daesang)', ko: '대상' },
  song: { es: 'Canción', en: 'Song', ko: '노래' },
  video: { es: 'Vídeo musical', en: 'Music video', ko: '뮤직비디오' },
  performance: { es: 'Actuación', en: 'Performance', ko: '퍼포먼스' },
  choreography: { es: 'Coreografía', en: 'Choreography', ko: '안무' },
  album: { es: 'Álbum', en: 'Album', ko: '앨범' },
  group: { es: 'Grupo', en: 'Group', ko: '그룹' },
  artist: { es: 'Artista', en: 'Artist', ko: '아티스트' },
  tour: { es: 'Gira', en: 'Tour', ko: '투어' },
  special: { es: 'Reconocimiento', en: 'Special recognition', ko: '특별상' },
} satisfies Record<string, Translated>;

type CategoryKey = keyof typeof CATEGORIES;

type Row = [string, number, string, CategoryKey, string | null];

const WINS: Row[] = [
  ['MAMA Awards', 2016, 'Best Music Video', 'video', 'Whistle'],
  ['MAMA Awards', 2016, 'Best of Next Female Artist', 'rookie', null],
  ['Melon Music Awards', 2016, 'Best New Artist', 'rookie', null],
  ['Asia Artist Awards', 2016, 'Rookie Singer Award', 'rookie', null],
  ['Golden Disc Awards', 2017, 'Rookie Artist of the Year', 'rookie', null],
  ['Seoul Music Awards', 2017, 'New Artist of the Year', 'rookie', null],
  ['Japan Gold Disc Awards', 2018, 'Best 3 New Artists (Asia)', 'rookie', null],

  ['Golden Disc Awards', 2018, 'Best Digital Song (Bonsang)', 'bonsang', "As If It's Your Last"],
  ['Melon Music Awards', 2018, 'Best Dance – Female', 'performance', 'Ddu-Du Ddu-Du'],
  ['Melon Music Awards', 2018, 'Top 10 Artists', 'artist', null],
  ['Seoul Music Awards', 2018, 'Main Prize (Bonsang)', 'bonsang', null],
  ['Golden Disc Awards', 2019, 'Best Digital Song (Bonsang)', 'bonsang', 'Ddu-Du Ddu-Du'],
  ['Golden Disc Awards', 2019, 'Cosmopolitan Artist Award', 'special', null],

  ['Teen Choice Awards', 2019, 'Choice Song: Group', 'song', 'Ddu-Du Ddu-Du'],
  ["People's Choice Awards", 2019, 'The Group of 2019', 'group', null],
  ["People's Choice Awards", 2019, 'The Music Video of 2019', 'video', 'Kill This Love'],
  ["People's Choice Awards", 2019, 'The Concert Tour of 2019', 'tour', 'In Your Area World Tour'],
  [
    'iHeartRadio Music Awards',
    2020,
    'Favourite Music Video Choreography',
    'choreography',
    'Kill This Love',
  ],
  ['MTV Video Music Awards', 2020, 'Song of Summer', 'song', 'How You Like That'],
  ['Spotify Awards', 2020, 'Most Listened K-pop Artist (Female)', 'artist', null],
  ['Variety Hitmakers Awards', 2020, 'Group of the Year', 'group', null],

  ['MAMA Awards', 2020, 'Best Female Group', 'group', null],
  ['MAMA Awards', 2020, 'Best Dance Performance Female Group', 'performance', 'How You Like That'],
  ['MAMA Awards', 2020, '2020 Visionary', 'special', null],
  ['Golden Disc Awards', 2021, 'Best Album (Bonsang)', 'bonsang', 'The Album'],
  ['Golden Disc Awards', 2021, 'Best Digital Song (Bonsang)', 'bonsang', 'How You Like That'],

  ['MAMA Awards', 2022, 'Best Female Group', 'group', null],
  ['MAMA Awards', 2022, 'Best Music Video', 'video', 'Pink Venom'],
  [
    'MTV Video Music Awards',
    2022,
    'Best Metaverse Performance',
    'performance',
    'Blackpink: The Virtual',
  ],
  [
    'MTV Europe Music Awards',
    2022,
    'Best Metaverse Performance',
    'performance',
    'Blackpink: The Virtual',
  ],
  ['Golden Disc Awards', 2023, 'Best Album (Bonsang)', 'bonsang', 'Born Pink'],
  ['Seoul Music Awards', 2023, 'Main Prize (Bonsang)', 'bonsang', 'Born Pink'],
  ['MTV Video Music Awards', 2023, 'Best Choreography', 'choreography', 'Pink Venom'],
  ['MTV Video Music Awards', 2023, 'Group of the Year', 'group', null],
  ['Billboard Music Awards', 2023, 'Top K-Pop Touring Artist', 'tour', null],
  ['Seoul Music Awards', 2024, 'World Best Artist', 'artist', null],

  ['MTV Video Music Awards', 2025, 'Best Group', 'group', null],
  ['Asia Artist Awards', 2025, 'Legendary Group – Female', 'group', null],
  ['Asia Star Entertainer Awards', 2026, 'Song of the Year (daesang)', 'daesang', 'Jump'],
  ['Golden Disc Awards', 2026, 'Best Digital Song (Bonsang)', 'bonsang', 'Jump'],
];

const NOMINATIONS: Row[] = [
  ['Billboard Music Awards', 2021, 'Top Social Artist', 'artist', null],
  ['Brit Awards', 2023, 'Best International Group', 'group', null],
];

const build = (rows: Row[], won: boolean): AwardSeed[] =>
  rows.map(([organization, year, name, category, work]) => ({
    name,
    category: CATEGORIES[category].en,
    year,
    organization,
    work,
    won,
    verified: true,
    source: won ? FUENTE : `${FUENTE} Nominación: no ganó.`,
    translations: { category: CATEGORIES[category] },
  }));

export const AWARDS: AwardSeed[] = [...build(WINS, true), ...build(NOMINATIONS, false)];
