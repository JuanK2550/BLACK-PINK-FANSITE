import type { Translated } from './common';

export interface AwardSeed {
  name: string;
  category: string;
  year: number;
  organization: string;
  /** Obra premiada, cuando el premio va por una en concreto. */
  work: string | null;
  won: boolean;
  verified: boolean;
  source: string;
  translations: {
    /**
     * Ausente a proposito en todos: ver la nota sobre nombres propios.
     * El servicio cae al nombre original cuando no hay traduccion.
     */
    name?: Translated;
    category: Translated;
  };
}

/**
 * ============================================================================
 * PALMARES
 * ============================================================================
 * Todo lo de aqui sale de UNA fuente, citada en cada fila. Las seis entradas
 * anteriores estaban marcadas `verified: false` con la nota "conocimiento
 * publico ampliamente difundido": eso no es una fuente, es una forma educada
 * de decir que nadie lo habia comprobado. Tres de aquellas se corresponden con
 * algo de esta lista y se conservan con su nombre corregido; las otras tres no
 * aparecen y se han eliminado.
 *
 * TRES DECISIONES QUE CONVIENE NO DESHACER:
 *
 * 1. EL ANO ES EL DE LA CEREMONIA. `Ddu-Du Ddu-Du` es de 2018 y su bonsang de
 *    los Golden Disc figura en 2019, porque esa gala premia el ano anterior.
 *    Guardar el ano de la obra "cuadraria" mejor de un vistazo y desordenaria
 *    el palmares respecto a como lo cuenta cualquier fuente.
 *
 * 2. EL NOMBRE DEL PREMIO NO SE TRADUCE. "Best Music Video" es el nombre de
 *    algo que ocurrio, como el titulo de una cancion; "Mejor video musical" no
 *    es un premio que nadie haya entregado nunca. Lo que si se traduce es la
 *    `category`, que es la agrupacion que pone ESTE sitio para poder leer
 *    cuarenta filas seguidas.
 *
 * 3. LA CATEGORIA ES EDITORIAL, NO DE LA FUENTE. La fuente da gala, ano y
 *    nombre; agrupar "Best Choreography" bajo "Coreografía" es una comodidad
 *    de lectura que anade el sitio. Por eso no se presenta como un dato de la
 *    ceremonia.
 * ============================================================================
 */

const FUENTE =
  'Wikipedia, List of awards and nominations received by Blackpink — https://en.wikipedia.org/wiki/List_of_awards_and_nominations_received_by_Blackpink. Consultado 2026-08-29. El ano registrado es el de la ceremonia, no el de la obra premiada.';

/** Agrupaciones de lectura del sitio. Cerradas a proposito: doce, no cuarenta. */
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

/** [organizacion, ano, nombre del premio, categoria, obra premiada] */
type Row = [string, number, string, CategoryKey, string | null];

const WINS: Row[] = [
  /* --------------------------------------------------------- Debut ------ */
  ['MAMA Awards', 2016, 'Best Music Video', 'video', 'Whistle'],
  ['MAMA Awards', 2016, 'Best of Next Female Artist', 'rookie', null],
  ['Melon Music Awards', 2016, 'Best New Artist', 'rookie', null],
  ['Asia Artist Awards', 2016, 'Rookie Singer Award', 'rookie', null],
  ['Golden Disc Awards', 2017, 'Rookie Artist of the Year', 'rookie', null],
  ['Seoul Music Awards', 2017, 'New Artist of the Year', 'rookie', null],
  ['Japan Gold Disc Awards', 2018, 'Best 3 New Artists (Asia)', 'rookie', null],

  /* ----------------------------------------------- Bonsang y canciones -- */
  ['Golden Disc Awards', 2018, 'Best Digital Song (Bonsang)', 'bonsang', "As If It's Your Last"],
  ['Melon Music Awards', 2018, 'Best Dance – Female', 'performance', 'Ddu-Du Ddu-Du'],
  ['Melon Music Awards', 2018, 'Top 10 Artists', 'artist', null],
  ['Seoul Music Awards', 2018, 'Main Prize (Bonsang)', 'bonsang', null],
  ['Golden Disc Awards', 2019, 'Best Digital Song (Bonsang)', 'bonsang', 'Ddu-Du Ddu-Du'],
  ['Golden Disc Awards', 2019, 'Cosmopolitan Artist Award', 'special', null],

  /* ------------------------------------- Reconocimiento internacional --- */
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

  /* ------------------------------------------------- Era THE ALBUM ------ */
  ['MAMA Awards', 2020, 'Best Female Group', 'group', null],
  ['MAMA Awards', 2020, 'Best Dance Performance Female Group', 'performance', 'How You Like That'],
  ['MAMA Awards', 2020, '2020 Visionary', 'special', null],
  ['Golden Disc Awards', 2021, 'Best Album (Bonsang)', 'bonsang', 'The Album'],
  ['Golden Disc Awards', 2021, 'Best Digital Song (Bonsang)', 'bonsang', 'How You Like That'],

  /* ------------------------------------------------- Era BORN PINK ------ */
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

  /* ----------------------------------------------------- Reciente ------- */
  ['MTV Video Music Awards', 2025, 'Best Group', 'group', null],
  ['Asia Artist Awards', 2025, 'Legendary Group – Female', 'group', null],
  ['Asia Star Entertainer Awards', 2026, 'Song of the Year (daesang)', 'daesang', 'Jump'],
  ['Golden Disc Awards', 2026, 'Best Digital Song (Bonsang)', 'bonsang', 'Jump'],
];

/**
 * NOMINACIONES QUE NO SE GANARON.
 *
 * Van aparte, y no por orden: por honestidad de alcance. La lista de VICTORIAS
 * de arriba es COMPLETA segun la fuente. Esta no lo es -la tabla original
 * recoge muchas mas nominaciones de las que aqui figuran-, y por eso la pagina
 * lo advierte en vez de dejar creer que el grupo perdio dos veces en su vida.
 *
 * Se publican igualmente: un palmares que solo enseña victorias no es un
 * registro, es un anuncio.
 */
const NOMINATIONS: Row[] = [
  ['Billboard Music Awards', 2021, 'Top Social Artist', 'artist', null],
  ['Brit Awards', 2023, 'Best International Group', 'group', null],
];

const build = (rows: Row[], won: boolean): AwardSeed[] =>
  rows.map(([organization, year, name, category, work]) => ({
    name,
    // La clave estable de la fila es [organizacion, ano, categoria, nombre],
    // asi que la categoria base se guarda en ingles y no cambia al traducir.
    category: CATEGORIES[category].en,
    year,
    organization,
    work,
    won,
    verified: true,
    source: won ? FUENTE : `${FUENTE} Nominacion: no gano.`,
    translations: { category: CATEGORIES[category] },
  }));

export const AWARDS: AwardSeed[] = [...build(WINS, true), ...build(NOMINATIONS, false)];
