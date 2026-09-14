// Hitos de la cronología.

import { day, SOURCES, type Translated } from './common';

export interface TimelineSeed {
  date: Date;
  category: 'DEBUT' | 'COMEBACK' | 'AWARD' | 'TOUR' | 'RECORD' | 'SOLO' | 'OTHER';
  importance: number;
  datePrecision: 'day' | 'month' | 'year';
  memberSlug?: string;
  verified: boolean;
  source: string;
  title: Translated;
  description: Translated;
}

export const TIMELINE: TimelineSeed[] = [
  {
    date: day('2016-08-08'),
    category: 'DEBUT',
    importance: 5,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.official,
    title: {
      es: 'Debut con SQUARE ONE',
      en: 'Debut with SQUARE ONE',
      ko: 'SQUARE ONE으로 데뷔',
    },
    description: {
      es: 'BLACKPINK debuta bajo YG Entertainment con el álbum sencillo SQUARE ONE y dos canciones principales, Whistle y Boombayah.',
      en: 'BLACKPINK debut under YG Entertainment with the single album SQUARE ONE and two title tracks, Whistle and Boombayah.',
      ko: 'BLACKPINK가 YG 엔터테인먼트 소속으로 싱글 앨범 SQUARE ONE과 더블 타이틀곡 Whistle, Boombayah로 데뷔했습니다.',
    },
  },
  {
    date: day('2016-11-01'),
    category: 'COMEBACK',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.discography,
    title: { es: 'SQUARE TWO', en: 'SQUARE TWO', ko: 'SQUARE TWO' },
    description: {
      es: 'Segundo álbum sencillo, con Playing with Fire y Stay como canciones principales.',
      en: 'Second single album, with Playing with Fire and Stay as title tracks.',
      ko: 'Playing with Fire와 Stay를 타이틀곡으로 한 두 번째 싱글 앨범.',
    },
  },
  {
    date: day('2017-06-22'),
    category: 'COMEBACK',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.discography,
    title: {
      es: 'Sencillo As If It’s Your Last',
      en: 'Single As If It’s Your Last',
      ko: '싱글 마지막처럼 발표',
    },
    description: {
      es: 'Sencillo digital publicado un año después del debut.',
      en: 'Digital single released a year after the debut.',
      ko: '데뷔 1년 뒤에 발표한 디지털 싱글.',
    },
  },
  {
    date: day('2017-08-30'),
    category: 'OTHER',
    importance: 2,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Blackpink — https://en.wikipedia.org/wiki/Blackpink. Fecha de la edición física, la misma que la ficha del disco. Consultado 2026-09-13.',
    title: {
      es: 'Debut en el mercado japonés',
      en: 'Debut in the Japanese market',
      ko: '일본 시장 데뷔',
    },
    description: {
      es: 'Publican su primer EP japonés, BLACKPINK. Antes, el 20 de julio, habían presentado su debut en el Nippon Budokan de Tokio ante más de 14.000 personas.',
      en: 'They release their first Japanese EP, BLACKPINK. Before that, on 20 July, they held a debut showcase at the Nippon Budokan in Tokyo for more than 14,000 people.',
      ko: '첫 일본 EP BLACKPINK를 발표했습니다. 이에 앞서 7월 20일에는 도쿄 닛폰부도칸에서 1만 4천여 명 앞에서 데뷔 쇼케이스를 열었습니다.',
    },
  },
  {
    date: day('2018-06-15'),
    category: 'COMEBACK',
    importance: 4,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.discography,
    title: { es: 'SQUARE UP', en: 'SQUARE UP', ko: 'SQUARE UP' },
    description: {
      es: 'Primer EP del grupo, con DDU-DU DDU-DU como canción principal.',
      en: 'The group first EP, with DDU-DU DDU-DU as the title track.',
      ko: 'DDU-DU DDU-DU를 타이틀곡으로 한 첫 미니 앨범.',
    },
  },
  {
    date: day('2018-06-01'),
    category: 'RECORD',
    importance: 3,
    datePrecision: 'month',
    verified: true,
    source:
      'Wikipedia, Ddu-Du Ddu-Du — https://en.wikipedia.org/wiki/Ddu-Du_Ddu-Du. Se guarda el mes: el récord se mide en las 24 horas siguientes al estreno del 15 de junio. Consultado 2026-09-13.',
    title: {
      es: 'Récord de visualizaciones con DDU-DU DDU-DU',
      en: 'View record with DDU-DU DDU-DU',
      ko: 'DDU-DU DDU-DU 조회수 기록',
    },
    description: {
      es: 'El videoclip de DDU-DU DDU-DU suma 36,2 millones de reproducciones en sus primeras 24 horas: el vídeo en línea más visto en su primer día de un artista coreano.',
      en: 'The DDU-DU DDU-DU music video draws 36.2 million views in its first 24 hours, the most-viewed online video in its first day by a Korean act.',
      ko: 'DDU-DU DDU-DU 뮤직비디오가 공개 24시간 만에 3,620만 회 조회되며 한국 아티스트 영상 중 첫날 최다 조회수를 기록했습니다.',
    },
  },
  {
    date: day('2018-11-10'),
    category: 'TOUR',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, In Your Area World Tour — https://en.wikipedia.org/wiki/In_Your_Area_World_Tour. Consultado 2026-09-13.',
    title: {
      es: 'Arranque de la gira IN YOUR AREA',
      en: 'IN YOUR AREA tour begins',
      ko: 'IN YOUR AREA 투어 시작',
    },
    description: {
      es: 'Primera gira mundial del grupo, que arrancó en el Olympic Gymnastics Arena de Seúl.',
      en: 'First world tour by the group, opening at the Olympic Gymnastics Arena in Seoul.',
      ko: '그룹의 첫 월드 투어가 서울 올림픽체조경기장에서 막을 올렸습니다.',
    },
  },
  {
    date: day('2018-11-12'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'jennie',
    verified: true,
    source: SOURCES.discography,
    title: {
      es: 'Jennie publica SOLO',
      en: 'Jennie releases SOLO',
      ko: '제니, SOLO 발표',
    },
    description: {
      es: 'Primer lanzamiento en solitario de una integrante del grupo.',
      en: 'The first solo release by a member of the group.',
      ko: '그룹 멤버 중 최초의 솔로 음원 발표.',
    },
  },
  {
    date: day('2018-12-05'),
    category: 'COMEBACK',
    importance: 2,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Blackpink in Your Area - https://en.wikipedia.org/wiki/Blackpink_in_Your_Area. ',
    title: {
      es: 'BLACKPINK IN YOUR AREA',
      en: 'BLACKPINK IN YOUR AREA',
      ko: 'BLACKPINK IN YOUR AREA',
    },
    description: {
      es: 'Álbum recopilatorio publicado en Japón con canciones que el grupo ya había editado.',
      en: 'Compilation album released in Japan with songs the group had already put out.',
      ko: '그룹이 이미 발표한 곡을 모아 일본에서 발매한 컴필레이션 앨범.',
    },
  },
  {
    date: day('2019-04-05'),
    category: 'COMEBACK',
    importance: 4,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.discography,
    title: { es: 'KILL THIS LOVE', en: 'KILL THIS LOVE', ko: 'KILL THIS LOVE' },
    description: {
      es: 'Segundo EP, publicado una semana antes de su primera actuación en Coachella.',
      en: 'Second EP, released a week before their first Coachella performance.',
      ko: '첫 코첼라 무대 일주일 전에 발표한 두 번째 미니 앨범.',
    },
  },
  {
    date: day('2019-04-12'),
    category: 'RECORD',
    importance: 5,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.festival,
    title: {
      es: 'Primera actuación en Coachella',
      en: 'First Coachella performance',
      ko: '첫 코첼라 무대',
    },
    description: {
      es: 'Primer grupo femenino de K-pop en actuar en el festival de Coachella.',
      en: 'First K-pop girl group to perform at the Coachella festival.',
      ko: '코첼라 페스티벌 무대에 선 최초의 K-팝 걸그룹.',
    },
  },
  {
    date: day('2019-11-11'),
    category: 'RECORD',
    importance: 4,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Ddu-Du Ddu-Du — https://en.wikipedia.org/wiki/Ddu-Du_Ddu-Du. Consultado 2026-09-13.',
    title: {
      es: 'Mil millones de reproducciones con DDU-DU DDU-DU',
      en: 'One billion views for DDU-DU DDU-DU',
      ko: 'DDU-DU DDU-DU 10억 조회수',
    },
    description: {
      es: 'El videoclip de DDU-DU DDU-DU supera los mil millones de reproducciones en YouTube: es el primero de un grupo de K-pop en conseguirlo.',
      en: 'The DDU-DU DDU-DU video passes one billion YouTube views, the first by a K-pop group to do so.',
      ko: 'DDU-DU DDU-DU 뮤직비디오가 K-팝 그룹 최초로 YouTube 10억 조회수를 넘었습니다.',
    },
  },
  {
    date: day('2020-06-26'),
    category: 'COMEBACK',
    importance: 4,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.discography,
    title: {
      es: 'Sencillo How You Like That',
      en: 'Single How You Like That',
      ko: '싱글 How You Like That',
    },
    description: {
      es: 'Primer adelanto de THE ALBUM.',
      en: 'First preview of THE ALBUM.',
      ko: 'THE ALBUM의 첫 선공개 곡.',
    },
  },
  {
    date: day('2020-08-28'),
    category: 'COMEBACK',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.discography,
    title: {
      es: 'Ice Cream, con Selena Gomez',
      en: 'Ice Cream, with Selena Gomez',
      ko: 'Ice Cream, 셀레나 고메즈와 협업',
    },
    description: {
      es: 'Segundo adelanto de THE ALBUM, en colaboración con Selena Gomez.',
      en: 'Second preview of THE ALBUM, in collaboration with Selena Gomez.',
      ko: '셀레나 고메즈와 함께한 THE ALBUM의 두 번째 선공개 곡.',
    },
  },
  {
    date: day('2020-08-01'),
    category: 'RECORD',
    importance: 4,
    datePrecision: 'month',
    verified: true,
    source:
      'TenAsia, "BLACKPINK Becomes First Kpop Girl Group to Win MTV VMA", 2020-08-31 — http://en.tenasia.com/archives/106836. La victoria (Song of Summer) figura además en Wikipedia, List of awards and nominations received by Blackpink — https://en.wikipedia.org/wiki/List_of_awards_and_nominations_received_by_Blackpink. Consultado 2026-08-29. Se guarda el mes: la fuente fecha la noticia, no la gala.',
    title: {
      es: 'Primer MTV Vídeo Music Award del grupo',
      en: 'The group first MTV Video Music Award',
      ko: '그룹 최초의 MTV 비디오 뮤직 어워드 수상',
    },
    description: {
      es: 'How You Like That gana Song of Summer: el primer MTV VMA ganado por un grupo femenino de K-pop.',
      en: 'How You Like That wins Song of Summer, the first MTV VMA won by a K-pop girl group.',
      ko: 'How You Like That가 Song of Summer 부문을 수상하며 K-팝 걸그룹 최초로 MTV VMA를 받았습니다.',
    },
  },
  {
    date: day('2020-10-02'),
    category: 'COMEBACK',
    importance: 5,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.discography,
    title: {
      es: 'Publicación de THE ALBUM',
      en: 'THE ALBUM is released',
      ko: 'THE ALBUM 발매',
    },
    description: {
      es: 'Primer álbum de estudio completo en coreano, cuatro años después del debut.',
      en: 'First full-length Korean studio album, four years after the debut.',
      ko: '데뷔 4년 만에 발표한 첫 한국어 정규 앨범.',
    },
  },
  {
    date: day('2020-10-14'),
    category: 'OTHER',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.netflix,
    title: {
      es: 'Documental Light Up the Sky en Netflix',
      en: 'Light Up the Sky documentary on Netflix',
      ko: '넷플릭스 다큐멘터리 Light Up the Sky',
    },
    description: {
      es: 'Netflix estrena BLACKPINK: Light Up the Sky, un documental sobre la formación y los primeros años del grupo.',
      en: 'Netflix premieres BLACKPINK: Light Up the Sky, a documentary about the formation and early years of the group.',
      ko: '넷플릭스가 그룹의 결성과 초창기를 다룬 다큐멘터리 BLACKPINK: Light Up the Sky를 공개했습니다.',
    },
  },
  {
    date: day('2021-01-31'),
    category: 'TOUR',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.official,
    title: {
      es: 'Concierto en streaming THE SHOW',
      en: 'THE SHOW livestream concert',
      ko: '온라인 콘서트 THE SHOW',
    },
    description: {
      es: 'Concierto retransmitido en directo durante la pandemia, sin público presencial.',
      en: 'Concert streamed live during the pandemic, with no in-person audience.',
      ko: '팬데믹 기간에 무관중으로 생중계한 콘서트.',
    },
  },
  {
    date: day('2021-03-12'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'rose',
    verified: true,
    source: SOURCES.discography,
    title: { es: 'Rosé publica R', en: 'Rosé releases R', ko: '로제, R 발표' },
    description: {
      es: 'Debut en solitario de Rosé, con On The Ground y Gone.',
      en: 'Rosé solo debut, with On The Ground and Gone.',
      ko: 'On The Ground와 Gone이 수록된 로제의 솔로 데뷔작.',
    },
  },
  {
    date: day('2021-09-10'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'lisa',
    verified: true,
    source: SOURCES.discography,
    title: { es: 'Lisa publica LALISA', en: 'Lisa releases LALISA', ko: '리사, LALISA 발표' },
    description: {
      es: 'Debut en solitario de Lisa, con LALISA y MONEY.',
      en: 'Lisa solo debut, with LALISA and MONEY.',
      ko: 'LALISA와 MONEY가 수록된 리사의 솔로 데뷔작.',
    },
  },
  {
    date: day('2021-11-02'),
    category: 'OTHER',
    importance: 2,
    datePrecision: 'day',
    verified: true,
    source:
      'Rappler, «At COP26, BLACKPINK urges world leaders to take climate action in your area» — https://www.rappler.com/entertainment/music/blackpink-urges-world-leaders-take-climate-action-in-area-cop26/. Fecha local de Glasgow. Consultado 2026-09-13.',
    title: {
      es: 'Participación en la COP26',
      en: 'Involvement with COP26',
      ko: 'COP26 참여',
    },
    description: {
      es: 'Como embajadoras de la cumbre del clima COP26 de Glasgow, nombradas por el Gobierno británico ese mismo año, dirigen un vídeo a los líderes mundiales: «Climate Action in Your Area».',
      en: 'As advocates for the COP26 climate summit in Glasgow, appointed by the UK Government that same year, they address a video to world leaders: “Climate Action in Your Area”.',
      ko: '영국 정부가 그해 임명한 COP26 기후 정상회의 홍보대사로서, 세계 지도자들에게 보내는 영상 「Climate Action in Your Area」를 공개했습니다.',
    },
  },
  {
    date: day('2022-08-19'),
    category: 'COMEBACK',
    importance: 4,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.discography,
    title: { es: 'Sencillo Pink Venom', en: 'Single Pink Venom', ko: '싱글 Pink Venom' },
    description: {
      es: 'Primer adelanto de BORN PINK.',
      en: 'First preview of BORN PINK.',
      ko: 'BORN PINK의 첫 선공개 곡.',
    },
  },
  {
    date: day('2022-09-16'),
    category: 'COMEBACK',
    importance: 5,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.discography,
    title: { es: 'Publicación de BORN PINK', en: 'BORN PINK is released', ko: 'BORN PINK 발매' },
    description: {
      es: 'Segundo álbum de estudio, con Pink Venom y Shut Down como canciones principales.',
      en: 'Second studio album, with Pink Venom and Shut Down as title tracks.',
      ko: 'Pink Venom과 Shut Down을 타이틀곡으로 한 두 번째 정규 앨범.',
    },
  },
  {
    date: day('2022-10-01'),
    category: 'RECORD',
    importance: 5,
    datePrecision: 'month',
    verified: true,
    source: SOURCES.press,
    title: {
      es: 'BORN PINK llega al número uno de la Billboard 200',
      en: 'BORN PINK reaches number one on the Billboard 200',
      ko: 'BORN PINK, 빌보드 200 1위',
    },
    description: {
      es: 'Primer álbum de un grupo femenino de K-pop en encabezar la lista Billboard 200. Mes confirmado; semana exacta de la lista pendiente de contrastar.',
      en: 'First album by a K-pop girl group to top the Billboard 200. Month confirmed; the exact chart week is pending verification.',
      ko: 'K-팝 걸그룹 최초로 빌보드 200 정상에 오른 앨범. 월은 확인되었으나 정확한 차트 주차는 확인 대기 중.',
    },
  },
  {
    date: day('2022-10-15'),
    category: 'TOUR',
    importance: 4,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Born Pink World Tour — https://en.wikipedia.org/wiki/Born_Pink_World_Tour. Consultado 2026-09-13.',
    title: {
      es: 'Arranque de la gira BORN PINK en Seúl',
      en: 'BORN PINK tour begins in Seoul',
      ko: 'BORN PINK 투어, 서울에서 시작',
    },
    description: {
      es: 'Primer concierto de la gira mundial BORN PINK, en el KSPO Dome de Seúl.',
      en: 'First concert of the BORN PINK world tour, at KSPO Dome in Seoul.',
      ko: 'BORN PINK 월드 투어의 첫 공연이 서울 KSPO돔에서 열렸습니다.',
    },
  },
  {
    date: day('2023-03-31'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'jisoo',
    verified: true,
    source: SOURCES.discography,
    title: { es: 'Jisoo publica ME', en: 'Jisoo releases ME', ko: '지수, ME 발표' },
    description: {
      es: 'Debut en solitario de Jisoo, con FLOWER como canción principal. Completa los cuatro debuts en solitario del grupo.',
      en: 'Jisoo solo debut, with FLOWER as the title track. It completes the four solo debuts in the group.',
      ko: 'FLOWER를 타이틀곡으로 한 지수의 솔로 데뷔작. 이로써 멤버 4인의 솔로 데뷔가 모두 마무리되었습니다.',
    },
  },
  {
    date: day('2023-04-15'),
    category: 'RECORD',
    importance: 5,
    datePrecision: 'day',
    verified: true,
    source: SOURCES.festival,
    title: {
      es: 'Cabezas de cartel en Coachella',
      en: 'Coachella headliners',
      ko: '코첼라 헤드라이너',
    },
    description: {
      es: 'Primer acto de K-pop en encabezar el cartel del festival de Coachella.',
      en: 'First K-pop act to headline the Coachella festival.',
      ko: '코첼라 페스티벌의 헤드라이너에 오른 최초의 K-팝 그룹.',
    },
  },
  {
    date: day('2023-07-02'),
    category: 'TOUR',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Blackpink — https://en.wikipedia.org/wiki/Blackpink. Fecha local de Londres. Consultado 2026-09-13.',
    title: {
      es: 'Cabezas de cartel en BST Hyde Park',
      en: 'BST Hyde Park headliners',
      ko: 'BST 하이드 파크 헤드라이너',
    },
    description: {
      es: 'Encabezan el festival BST Hyde Park de Londres: la primera banda coreana en encabezar un gran festival del Reino Unido.',
      en: 'They headline BST Hyde Park in London, the first Korean band to headline a major UK festival.',
      ko: '런던 BST 하이드 파크의 헤드라이너로 서며, 영국 대형 페스티벌의 헤드라이너가 된 첫 한국 밴드가 되었습니다.',
    },
  },
  {
    date: day('2023-09-01'),
    category: 'RECORD',
    importance: 4,
    datePrecision: 'month',
    verified: true,
    source:
      'Gulf News, "Blackpink becomes the first girl group in 24 years to win Best Group at the VMAs", 2023-09-13 — https://gulfnews.com/entertainment/blackpink-becomes-the-first-girl-group-in-24-years-to-win-best-group-at-the-vmas-1.1694609053080. La victoria figura además en Wikipedia, List of awards and nominations received by Blackpink. Consultado 2026-08-29. Nota: el titular dice "Best Group"; la categoría oficial de la gala de 2023 es "Group of the Year", que es como se guarda en premios. Se guarda el mes: la fuente fecha la noticia, no la gala.',
    title: {
      es: 'Group of the Year en los MTV Vídeo Music Awards',
      en: 'Group of the Year at the MTV Video Music Awards',
      ko: 'MTV 비디오 뮤직 어워드 Group of the Year 수상',
    },
    description: {
      es: 'Primer grupo femenino en ganar esta categoría en veinticuatro años.',
      en: 'The first girl group to take this category in twenty-four years.',
      ko: '24년 만에 이 부문을 수상한 첫 걸그룹입니다.',
    },
  },
  {
    date: day('2023-09-17'),
    category: 'TOUR',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Born Pink World Tour — https://en.wikipedia.org/wiki/Born_Pink_World_Tour. Consultado 2026-09-13.',
    title: {
      es: 'Final de la gira BORN PINK',
      en: 'End of the BORN PINK tour',
      ko: 'BORN PINK 투어 마무리',
    },
    description: {
      es: 'Último concierto de la gira, en el Gocheok Sky Dome de Seúl: 66 conciertos en 22 países y 1,8 millones de espectadores.',
      en: 'Final concert of the tour, at Gocheok Sky Dome in Seoul: 66 concerts in 22 countries and 1.8 million attendees.',
      ko: '서울 고척스카이돔에서 투어의 마지막 공연이 열렸습니다. 22개국에서 66회 공연, 관객 180만 명을 기록했습니다.',
    },
  },
  {
    date: day('2023-11-22'),
    category: 'AWARD',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source:
      'The Royal Family, «The King presents Honorary MBEs to BLACKPINK» — https://www.royal.uk/news-and-activity/2023-11-22/the-king-presents-honorary-mbes-to-blackpink. Consultado 2026-09-13.',
    title: {
      es: 'MBE honorario en el Reino Unido',
      en: 'Honorary MBE in the United Kingdom',
      ko: '영국 명예 대영제국 훈장(MBE)',
    },
    description: {
      es: 'El rey Carlos III nombra a las cuatro miembros honorarias de la Orden del Imperio Británico en el Palacio de Buckingham, por su papel como embajadoras de la COP26.',
      en: 'King Charles III invests the four as honorary Members of the Order of the British Empire at Buckingham Palace, for their role as COP26 advocates.',
      ko: '찰스 3세 국왕이 버킹엄궁에서 COP26 홍보대사로 활동한 네 멤버에게 명예 대영제국 훈장(MBE)을 수여했습니다.',
    },
  },
  {
    date: day('2024-06-28'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, Rockstar (Lisa song) — https://en.wikipedia.org/wiki/Rockstar_(Lisa_song). Publicada 2024-06-27 20:00 ET = 2024-06-28 09:00 KST. El proyecto adopta KST. Consultado 2026-08-29.',
    title: {
      es: 'Lisa publica ROCKSTAR',
      en: 'Lisa releases ROCKSTAR',
      ko: '리사, ROCKSTAR 발표',
    },
    description: {
      es: 'Nuevo sencillo en solitario de Lisa, tres años después de LALISA.',
      en: 'A new Lisa solo single, three years after LALISA.',
      ko: 'LALISA 이후 3년 만에 나온 리사의 새 솔로 싱글.',
    },
  },
  {
    date: day('2024-10-11'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'jennie',
    verified: true,
    source:
      'Wikipedia, Mantra (Jennie song) — https://en.wikipedia.org/wiki/Mantra_(Jennie_song). Confirmado también por nota de prensa de Sony Music. Consultado 2026-08-29.',
    title: {
      es: 'Jennie publica Mantra',
      en: 'Jennie releases Mantra',
      ko: '제니, Mantra 발표',
    },
    description: {
      es: 'Primer sencillo en solitario de Jennie desde SOLO, en 2018.',
      en: 'Jennie first solo single since SOLO, in 2018.',
      ko: '2018년 SOLO 이후 처음 나온 제니의 솔로 싱글.',
    },
  },
  {
    date: day('2024-10-18'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, APT. (song) — https://en.wikipedia.org/wiki/APT._(song). Consultado 2026-08-29. Nota: la Wikipedia en español indica 17 de octubre; se adopta el 18 por consenso de fuentes en inglés.',
    title: {
      es: 'Rosé publica APT. con Bruno Mars',
      en: 'Rosé releases APT. with Bruno Mars',
      ko: '로제, 브루노 마스와 APT. 발표',
    },
    description: {
      es: 'Colaboración internacional de Rosé con Bruno Mars.',
      en: 'International collaboration by Rosé with Bruno Mars.',
      ko: '로제와 브루노 마스의 국제 컬래버레이션.',
    },
  },
  {
    date: day('2024-12-06'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, Rosie (Rosé album) — https://en.wikipedia.org/wiki/Rosie_(Ros%C3%A9_album). Consultado 2026-08-29.',
    title: {
      es: 'Rosé publica rosie',
      en: 'Rosé releases rosie',
      ko: '로제, rosie 발표',
    },
    description: {
      es: 'Primer álbum de estudio en solitario de una integrante de BLACKPINK. Incluye APT.',
      en: 'The first solo studio album by a BLACKPINK member. It includes APT.',
      ko: 'BLACKPINK 멤버 최초의 솔로 정규 앨범. APT.가 수록되어 있습니다.',
    },
  },
  {
    date: day('2023-08-25'),
    category: 'COMEBACK',
    importance: 2,
    datePrecision: 'day',
    verified: true,
    source:
      'Banda sonora del videojuego BLACKPINK THE GAME. Fecha: ficha oficial en Spotify. Consultado 2026-09-11.',
    title: {
      es: 'BLACKPINK publica THE GIRLS',
      en: 'BLACKPINK release THE GIRLS',
      ko: 'BLACKPINK, THE GIRLS 발표',
    },
    description: {
      es: 'Canción del grupo para la banda sonora del videojuego BLACKPINK THE GAME.',
      en: 'Group song for the soundtrack of the video game BLACKPINK THE GAME.',
      ko: '게임 BLACKPINK THE GAME의 OST로 발표된 그룹의 곡.',
    },
  },
  {
    date: day('2025-02-14'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'jisoo',
    verified: true,
    source:
      'Wikipedia, Jisoo discography — https://en.wikipedia.org/wiki/Jisoo_discography. Consultado 2026-09-11.',
    title: {
      es: 'Jisoo publica AMORTAGE',
      en: 'Jisoo releases AMORTAGE',
      ko: '지수, AMORTAGE 발표',
    },
    description: {
      es: 'Primer EP de Jisoo, publicado con su propio sello, Blissoo, y Warner Records.',
      en: 'Jisoo first EP, released through her own label Blissoo and Warner Records.',
      ko: '지수가 자신의 레이블 블리수와 워너 레코드를 통해 발표한 첫 미니 앨범.',
    },
  },
  {
    date: day('2025-02-28'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Consultado 2026-09-11.',
    title: {
      es: 'Lisa publica Alter Ego',
      en: 'Lisa releases Alter Ego',
      ko: '리사, Alter Ego 발표',
    },
    description: {
      es: 'Primer álbum de estudio de Lisa, con quince canciones y colaboraciones con Doja Cat, RAYE, ROSALÍA, Future, Megan Thee Stallion y Tyla.',
      en: 'Lisa first studio album, with fifteen songs and collaborations with Doja Cat, RAYE, ROSALÍA, Future, Megan Thee Stallion and Tyla.',
      ko: '15곡이 수록된 리사의 첫 정규 앨범. 도자 캣, 레이, 로살리아, 퓨처, 메건 더 스탤리언, 타일라가 참여했습니다.',
    },
  },
  {
    date: day('2025-03-07'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'jennie',
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Consultado 2026-09-11.',
    title: {
      es: 'Jennie publica Ruby',
      en: 'Jennie releases Ruby',
      ko: '제니, Ruby 발표',
    },
    description: {
      es: 'Primer álbum de estudio de Jennie, con quince canciones y colaboraciones con FKJ, Dua Lipa, Doechii, Dominic Fike, Childish Gambino y Kali Uchis.',
      en: 'Jennie first studio album, with fifteen songs and collaborations with FKJ, Dua Lipa, Doechii, Dominic Fike, Childish Gambino and Kali Uchis.',
      ko: '15곡이 수록된 제니의 첫 정규 앨범. FKJ, 두아 리파, 도치, 도미닉 파이크, 차일디시 감비노, 칼리 우치스가 참여했습니다.',
    },
  },
  {
    date: day('2025-05-08'),
    category: 'SOLO',
    importance: 2,
    datePrecision: 'day',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, Rosé discography — https://en.wikipedia.org/wiki/Ros%C3%A9_discography. Fecha: ficha oficial en Spotify. Consultado 2026-09-11.',
    title: {
      es: 'Rosé canta Messy para la película F1',
      en: 'Rosé sings Messy for the film F1',
      ko: '로제, 영화 F1 OST Messy 발표',
    },
    description: {
      es: 'Canción de Rosé para la banda sonora de la película F1.',
      en: 'Rosé song for the soundtrack of the film F1.',
      ko: '영화 F1 사운드트랙에 수록된 로제의 곡.',
    },
  },
  {
    date: day('2025-07-11'),
    category: 'COMEBACK',
    importance: 4,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Deadline (EP) — https://en.wikipedia.org/wiki/Deadline_(EP). Consultado 2026-09-11.',
    title: {
      es: 'BLACKPINK publica JUMP',
      en: 'BLACKPINK release JUMP',
      ko: 'BLACKPINK, JUMP 발표',
    },
    description: {
      es: 'Sencillo que adelantó el EP DEADLINE.',
      en: 'Single released ahead of the EP DEADLINE.',
      ko: 'EP DEADLINE의 선공개 싱글.',
    },
  },
  {
    date: day('2025-10-10'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'jisoo',
    verified: true,
    source:
      'Wikipedia, Jisoo discography — https://en.wikipedia.org/wiki/Jisoo_discography. Consultado 2026-09-11.',
    title: {
      es: 'Jisoo publica EYES CLOSED con ZAYN',
      en: 'Jisoo releases EYES CLOSED with ZAYN',
      ko: '지수, 제인과 EYES CLOSED 발표',
    },
    description: {
      es: 'Dueto de Jisoo con el cantante inglés ZAYN.',
      en: 'Jisoo duet with English singer ZAYN.',
      ko: '지수와 영국 가수 제인의 듀엣곡.',
    },
  },
  {
    date: day('2026-02-27'),
    category: 'COMEBACK',
    importance: 5,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Deadline (EP) — https://en.wikipedia.org/wiki/Deadline_(EP). Consultado 2026-09-11.',
    title: {
      es: 'BLACKPINK publica el EP DEADLINE',
      en: 'BLACKPINK release the EP DEADLINE',
      ko: 'BLACKPINK, EP DEADLINE 발표',
    },
    description: {
      es: 'Tercer EP coreano del grupo, con cinco canciones: JUMP, GO, Me and my, Champion y Fxxxboy. GO es la canción principal.',
      en: 'The group third Korean EP, with five songs: JUMP, GO, Me and my, Champion and Fxxxboy. GO is the title track.',
      ko: '그룹의 세 번째 한국 미니 앨범. JUMP, GO, Me and my, Champion, Fxxxboy 다섯 곡이 수록되어 있으며 타이틀곡은 GO입니다.',
    },
  },
  {
    date: day('2026-05-21'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Fecha: ficha oficial en Spotify. Consultado 2026-09-11.',
    title: {
      es: 'Lisa publica Goals para el Mundial 2026',
      en: 'Lisa releases Goals for the 2026 World Cup',
      ko: '리사, 2026 월드컵 곡 Goals 발표',
    },
    description: {
      es: 'Canción de Lisa con Anitta y Rema para la Copa Mundial de la FIFA 2026.',
      en: 'Song by Lisa with Anitta and Rema for the 2026 FIFA World Cup.',
      ko: '2026 FIFA 월드컵을 위한 리사, 아니타, 레마의 곡.',
    },
  },
  {
    date: day('2026-08-28'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'jennie',
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Consultado 2026-09-11.',
    title: {
      es: 'Jennie publica el EP Fallen Angel',
      en: 'Jennie releases the EP Fallen Angel',
      ko: '제니, 미니 앨범 Fallen Angel 발표',
    },
    description: {
      es: 'EP de Jennie con tres canciones: FALLEN ANGEL, HEAVEN y Less than a Lover, que se adelantó como sencillo.',
      en: 'Jennie EP with three songs: FALLEN ANGEL, HEAVEN and Less than a Lover, which came out first as a single.',
      ko: 'FALLEN ANGEL, HEAVEN, 선공개 싱글 Less than a Lover 세 곡이 담긴 제니의 미니 앨범.',
    },
  },
  {
    date: day('2026-09-02'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Fecha: ficha oficial en Spotify. Consultado 2026-09-11.',
    title: {
      es: 'Lisa publica SaWaDiKa',
      en: 'Lisa releases SaWaDiKa',
      ko: '리사, SaWaDiKa 발표',
    },
    description: {
      es: 'Sencillo de Lisa.',
      en: 'Lisa single.',
      ko: '리사의 싱글.',
    },
  },
  {
    date: day('2026-09-04'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'jisoo',
    verified: true,
    source:
      'Wikipedia, Jisoo discography — https://en.wikipedia.org/wiki/Jisoo_discography. Consultado 2026-09-11.',
    title: {
      es: 'Jisoo publica CLICK',
      en: 'Jisoo releases CLICK',
      ko: '지수, CLICK 발표',
    },
    description: {
      es: 'Sencillo de Jisoo, publicado con Blissoo y Warner Records.',
      en: 'Jisoo single, released through Blissoo and Warner Records.',
      ko: '블리수와 워너 레코드를 통해 발표한 지수의 싱글.',
    },
  },
  {
    date: day('2018-10-19'),
    category: 'OTHER',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Kiss and Make Up (Dua Lipa and Blackpink song) — https://en.wikipedia.org/wiki/Kiss_and_Make_Up_(Dua_Lipa_and_Blackpink_song). Consultado 2026-09-11.',
    title: {
      es: 'Dua Lipa publica Kiss and Make Up con BLACKPINK',
      en: 'Dua Lipa releases Kiss and Make Up with BLACKPINK',
      ko: '두아 리파, BLACKPINK와 함께한 Kiss and Make Up 발표',
    },
    description: {
      es: 'Primera colaboración del grupo con una artista occidental, incluida en la reedición Dua Lipa: Complete Edition.',
      en: 'The group first collaboration with a Western artist, included on the reissue Dua Lipa: Complete Edition.',
      ko: '그룹의 첫 해외 아티스트 컬래버레이션. 리패키지 앨범 Dua Lipa: Complete Edition에 수록되었습니다.',
    },
  },
  {
    date: day('2020-05-28'),
    category: 'OTHER',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Sour Candy (Lady Gaga and Blackpink song) — https://en.wikipedia.org/wiki/Sour_Candy_(Lady_Gaga_and_Blackpink_song). Consultado 2026-09-11.',
    title: {
      es: 'Lady Gaga publica Sour Candy con BLACKPINK',
      en: 'Lady Gaga releases Sour Candy with BLACKPINK',
      ko: '레이디 가가, BLACKPINK와 함께한 Sour Candy 발표',
    },
    description: {
      es: 'Sencillo promocional del álbum Chromatica de Lady Gaga.',
      en: 'Promotional single from Lady Gaga album Chromatica.',
      ko: '레이디 가가의 앨범 Chromatica의 프로모션 싱글.',
    },
  },
  {
    date: day('2023-04-25'),
    category: 'SOLO',
    importance: 2,
    datePrecision: 'day',
    memberSlug: 'lisa',
    verified: true,
    source: 'Wikipedia, Shoong! — https://en.wikipedia.org/wiki/Shoong!. Consultado 2026-09-11.',
    title: {
      es: 'Taeyang publica Shoong! con Lisa',
      en: 'Taeyang releases Shoong! featuring Lisa',
      ko: '태양, 리사와 함께한 Shoong! 발표',
    },
    description: {
      es: 'Canción del EP Down to Earth de Taeyang.',
      en: 'Song from Taeyang EP Down to Earth.',
      ko: '태양의 미니 앨범 Down to Earth 수록곡.',
    },
  },
  {
    date: day('2025-02-16'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, The White Lotus season 3 — https://en.wikipedia.org/wiki/The_White_Lotus_season_3. Fecha del estreno en HBO, en Estados Unidos. Consultado 2026-09-13.',
    title: {
      es: 'Estreno de The White Lotus con Lisa en el reparto',
      en: 'The White Lotus premieres with Lisa in the cast',
      ko: '리사 출연작 The White Lotus 시즌 3 공개',
    },
    description: {
      es: 'HBO estrena la tercera temporada de la serie, ambientada en Tailandia. Lisa interpreta a Mook, mentora de bienestar del hotel.',
      en: 'HBO premieres the third season of the series, set in Thailand. Lisa plays Mook, a health mentor at the resort.',
      ko: 'HBO가 태국을 배경으로 한 시리즈의 세 번째 시즌을 공개했습니다. 리사는 리조트의 헬스 멘토 묵 역을 맡았습니다.',
    },
  },
  {
    date: day('2025-04-11'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, Coachella 2025 — https://en.wikipedia.org/wiki/Coachella_2025. Fecha local de Indio, California. Consultado 2026-09-13.',
    title: {
      es: 'Lisa actúa en solitario en Coachella',
      en: 'Lisa performs solo at Coachella',
      ko: '리사, 코첼라 솔로 무대',
    },
    description: {
      es: 'Primer fin de semana de Coachella 2025, en la carpa Sahara.',
      en: 'First weekend of Coachella 2025, at the Sahara tent.',
      ko: '코첼라 2025 첫째 주, 사하라 텐트 무대에 올랐습니다.',
    },
  },
  {
    date: day('2025-04-13'),
    category: 'SOLO',
    importance: 3,
    datePrecision: 'day',
    memberSlug: 'jennie',
    verified: true,
    source:
      'Wikipedia, Coachella 2025 — https://en.wikipedia.org/wiki/Coachella_2025. Fecha local de Indio, California. Consultado 2026-09-13.',
    title: {
      es: 'Jennie actúa en solitario en Coachella',
      en: 'Jennie performs solo at Coachella',
      ko: '제니, 코첼라 솔로 무대',
    },
    description: {
      es: 'Primer fin de semana de Coachella 2025, en el Outdoor Theatre, con Kali Uchis como invitada.',
      en: 'First weekend of Coachella 2025, at the Outdoor Theatre, with Kali Uchis as a guest.',
      ko: '코첼라 2025 첫째 주, 아웃도어 시어터 무대에 올랐습니다. 칼리 우치스가 게스트로 함께했습니다.',
    },
  },
  {
    date: day('2025-07-05'),
    category: 'TOUR',
    importance: 4,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Deadline World Tour — https://en.wikipedia.org/wiki/Deadline_World_Tour. Fecha local de cada concierto. Consultado 2026-09-13.',
    title: {
      es: 'Arranque de la gira DEADLINE en Goyang',
      en: 'DEADLINE tour begins in Goyang',
      ko: 'DEADLINE 투어, 고양에서 시작',
    },
    description: {
      es: 'Primer concierto de la gira mundial DEADLINE, en el Goyang Stadium. Es la primera gira del grupo solo en estadios.',
      en: 'First concert of the DEADLINE world tour, at Goyang Stadium. It is the first all-stadium tour by the group.',
      ko: 'DEADLINE 월드 투어의 첫 공연이 고양종합운동장에서 열렸습니다. 그룹의 첫 스타디움 투어입니다.',
    },
  },
  {
    date: day('2025-09-07'),
    category: 'AWARD',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, APT. (song) — https://en.wikipedia.org/wiki/Apt._(song). Consultado 2026-09-13. Fecha local de Nueva York.',
    title: {
      es: 'APT. gana Canción del Año en los MTV VMA',
      en: 'APT. wins Song of the Year at the MTV VMAs',
      ko: 'APT., MTV VMA 올해의 노래 수상',
    },
    description: {
      es: 'Rosé y Bruno Mars ganan con APT. el premio a la Canción del Año: es la primera vez que lo gana un artista de K-pop.',
      en: 'Rosé and Bruno Mars win Song of the Year with APT., the first time a K-pop act takes the award.',
      ko: '로제와 브루노 마스가 APT.로 올해의 노래상을 받았습니다. K-팝 아티스트로는 처음입니다.',
    },
  },
  {
    date: day('2026-01-26'),
    category: 'TOUR',
    importance: 3,
    datePrecision: 'day',
    verified: true,
    source:
      'Wikipedia, Deadline World Tour — https://en.wikipedia.org/wiki/Deadline_World_Tour. Fecha local de cada concierto. Consultado 2026-09-13.',
    title: {
      es: 'Final de la gira DEADLINE',
      en: 'End of the DEADLINE tour',
      ko: 'DEADLINE 투어 마무리',
    },
    description: {
      es: 'Último concierto de la gira, en el Kai Tak Stadium de Hong Kong, tras 33 conciertos.',
      en: 'Final concert of the tour, at Kai Tak Stadium in Hong Kong, after 33 shows.',
      ko: '홍콩 카이탁 스타디움에서 투어의 마지막 공연이 열렸습니다. 모두 33회 공연이었습니다.',
    },
  },
  {
    date: day('2026-02-01'),
    category: 'SOLO',
    importance: 4,
    datePrecision: 'day',
    memberSlug: 'rose',
    verified: true,
    source:
      'The Korea Times, «Rosé, Bruno Mars open Grammys with hit single APT.» — https://www.koreatimes.co.kr/entertainment/k-pop/20260202/rose-bruno-mars-open-grammys-with-hit-single-apt. Fecha local de Los Ángeles. Wikipedia, APT. (song) — https://en.wikipedia.org/wiki/Apt._(song). Consultado 2026-09-13.',
    title: {
      es: 'Rosé abre los Grammy con APT.',
      en: 'Rosé opens the Grammys with APT.',
      ko: '로제, 그래미 어워드 오프닝 무대',
    },
    description: {
      es: 'Rosé y Bruno Mars abren la 68.ª edición de los Grammy en Los Ángeles. APT. llegaba con tres nominaciones (Grabación del Año, Canción del Año y Mejor Interpretación Pop de Dúo o Grupo) y no ganó ninguna.',
      en: 'Rosé and Bruno Mars open the 68th Grammy Awards in Los Angeles. APT. had three nominations (Record of the Year, Song of the Year and Best Pop Duo/Group Performance) and won none.',
      ko: '로제와 브루노 마스가 로스앤젤레스에서 열린 제68회 그래미 어워드의 오프닝 무대를 꾸몄습니다. APT.는 올해의 레코드, 올해의 노래, 베스트 팝 듀오/그룹 퍼포먼스 3개 부문 후보에 올랐지만 수상하지 못했습니다.',
    },
  },
  {
    date: day('2026-08-08'),
    category: 'OTHER',
    importance: 4,
    datePrecision: 'day',
    verified: true,
    source:
      'The Korea Times, «BLACKPINK meets fans for 10th anniversary» — https://www.koreatimes.co.kr/entertainment/k-pop/20260809/blackpink-meets-fans-for-10th-anniversary. Consultado 2026-09-13. Korea JoongAng Daily — https://www.koreajoongangdaily.com/entertainment/blackpink-to-launch-heritageinspired-10th-anniversary-merch-with-national-museum-of-korea/12809619. Consultado 2026-09-13.',
    title: {
      es: 'Décimo aniversario del debut',
      en: 'Tenth anniversary of the debut',
      ko: '데뷔 10주년',
    },
    description: {
      es: 'Las cuatro integrantes se reúnen con 40 fans elegidos por sorteo en el Museo Nacional de Corea, en Seúl.',
      en: 'The four members meet 40 fans chosen by lottery at the National Museum of Korea in Seoul.',
      ko: '네 멤버가 서울 국립중앙박물관에서 추첨으로 선정된 팬 40명을 만났습니다.',
    },
  },
];
