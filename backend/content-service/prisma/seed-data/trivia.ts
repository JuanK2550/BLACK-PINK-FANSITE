// Curiosidades y récords.

import { SOURCES, type Translated } from './common';

export interface TriviaSeed {
  category: 'GROUP' | 'MEMBER' | 'MUSIC' | 'RECORD' | 'FANDOM' | 'STAGE' | 'OTHER';
  memberSlug?: string;
  verified: boolean;
  source: string;
  content: Translated;
}

export const TRIVIA: TriviaSeed[] = [
  {
    category: 'GROUP',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'BLACKPINK debutó el 8 de agosto de 2016 bajo YG Entertainment.',
      en: 'BLACKPINK debuted on 8 August 2016 under YG Entertainment.',
      ko: 'BLACKPINK는 2016년 8월 8일 YG 엔터테인먼트 소속으로 데뷔했습니다.',
    },
  },
  {
    category: 'GROUP',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'El grupo lo forman cuatro integrantes: Jisoo, Jennie, Rosé y Lisa.',
      en: 'The group has four members: Jisoo, Jennie, Rosé and Lisa.',
      ko: '그룹은 지수, 제니, 로제, 리사 네 명으로 이루어져 있습니다.',
    },
  },
  {
    category: 'GROUP',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'Jisoo es la integrante de mayor edad y Lisa la más joven.',
      en: 'Jisoo is the eldest member and Lisa the youngest.',
      ko: '지수가 맏언니이고 리사가 막내입니다.',
    },
  },
  {
    category: 'GROUP',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'Lisa es la única integrante que no nació en Corea del Sur: es tailandesa.',
      en: 'Lisa is the only member not born in South Korea: she is Thai.',
      ko: '리사는 한국에서 태어나지 않은 유일한 멤버로, 태국 출신입니다.',
    },
  },
  {
    category: 'GROUP',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'Los colores asociados al grupo son el negro y el rosa, como indica su nombre.',
      en: 'The colours associated with the group are black and pink, as the name says.',
      ko: '그룹을 상징하는 색은 이름 그대로 검정과 분홍입니다.',
    },
  },
  {
    category: 'GROUP',
    verified: true,
    source:
      'Wikipedia, Blackpink — https://en.wikipedia.org/wiki/Blackpink. Consultado 2026-09-13.',
    content: {
      es: 'Según YG Entertainment, el nombre quiere decir que «lo bonito no lo es todo»: un equipo que reúne belleza y también mucho talento.',
      en: 'According to YG Entertainment, the name means “pretty isn’t everything”: a team with beauty and great talent too.',
      ko: 'YG 엔터테인먼트에 따르면 그룹 이름에는 ‘예쁜 것이 전부가 아니다’라는 뜻이 담겨 있으며, 아름다움과 뛰어난 실력을 함께 갖춘 팀을 상징합니다.',
    },
  },
  {
    category: 'GROUP',
    verified: true,
    source:
      'Wikipedia, Blackpink — https://en.wikipedia.org/wiki/Blackpink. Consultado 2026-09-13.',
    content: {
      es: 'Fue el primer grupo femenino que YG Entertainment presentó en siete años.',
      en: 'It was the first girl group YG Entertainment debuted in seven years.',
      ko: 'YG 엔터테인먼트가 7년 만에 선보인 걸그룹입니다.',
    },
  },

  {
    category: 'FANDOM',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'El fandom se llama BLINK, contracción de BLAck y pINK.',
      en: 'The fandom is called BLINK, a contraction of BLAck and pINK.',
      ko: '팬덤 이름은 BLINK로, BLAck과 pINK를 합친 말입니다.',
    },
  },
  {
    category: 'FANDOM',
    verified: true,
    source:
      'Wikipedia, Blackpink — https://en.wikipedia.org/wiki/Blackpink. Consultado 2026-09-13.',
    content: {
      es: 'El nombre del fandom, BLINK, se anunció el 17 de enero de 2017, cinco meses después del debut.',
      en: 'The fandom name, BLINK, was announced on 17 January 2017, five months after the debut.',
      ko: '팬덤 이름 BLINK는 데뷔 5개월 뒤인 2017년 1월 17일에 발표되었습니다.',
    },
  },
  {
    category: 'FANDOM',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'El lightstick oficial del grupo tiene nombre propio. Denominación exacta pendiente de contrastar.',
      en: 'The group official lightstick has its own name. Exact name pending verification.',
      ko: '그룹의 공식 응원봉에는 고유한 이름이 있습니다. 정확한 명칭은 확인 대기 중.',
    },
  },

  {
    category: 'MEMBER',
    memberSlug: 'rose',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'Rosé nació en Nueva Zelanda y se crió en Australia antes de mudarse a Corea del Sur.',
      en: 'Rosé was born in New Zealand and raised in Australia before moving to South Korea.',
      ko: '로제는 뉴질랜드에서 태어나 호주에서 자란 뒤 한국으로 이주했습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'rose',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'El nombre artístico de Rosé viene de su nombre en inglés, Roseanne.',
      en: 'Rosé stage name comes from her English name, Roseanne.',
      ko: '로제의 활동명은 영어 이름 Roseanne에서 왔습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jennie',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'Jennie usa su propio nombre de pila como nombre artístico.',
      en: 'Jennie uses her own given name as her stage name.',
      ko: '제니는 본명을 그대로 활동명으로 사용합니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jisoo',
    verified: true,
    source: SOURCES.press,
    content: {
      es: 'Jisoo debutó como actriz protagonista en la serie Snowdrop, estrenada en 2021.',
      en: 'Jisoo made her lead acting debut in the series Snowdrop, released in 2021.',
      ko: '지수는 2021년 공개된 드라마 설강화로 주연 배우 데뷔를 했습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jennie',
    verified: true,
    source: SOURCES.press,
    content: {
      es: 'Jennie participó en la serie de HBO The Idol, estrenada en 2023.',
      en: 'Jennie appeared in the HBO series The Idol, released in 2023.',
      ko: '제니는 2023년 공개된 HBO 드라마 The Idol에 출연했습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jisoo',
    verified: true,
    source: SOURCES.press,
    content: {
      es: 'Jisoo es embajadora global de Dior.',
      en: 'Jisoo is a global ambassador for Dior.',
      ko: '지수는 디올의 글로벌 앰배서더입니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jennie',
    verified: true,
    source: SOURCES.press,
    content: {
      es: 'Jennie es embajadora global de Chanel.',
      en: 'Jennie is a global ambassador for Chanel.',
      ko: '제니는 샤넬의 글로벌 앰배서더입니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'rose',
    verified: true,
    source: SOURCES.press,
    content: {
      es: 'Rosé es embajadora global de Saint Laurent.',
      en: 'Rosé is a global ambassador for Saint Laurent.',
      ko: '로제는 생로랑의 글로벌 앰배서더입니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'lisa',
    verified: true,
    source: SOURCES.press,
    content: {
      es: 'Lisa es embajadora global de Celine.',
      en: 'Lisa is a global ambassador for Celine.',
      ko: '리사는 셀린느의 글로벌 앰배서더입니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) — https://en.wikipedia.org/wiki/Lisa_(rapper). Consultado 2026-09-13.',
    content: {
      es: 'Lisa nació como Pranpriya Manobal y cambió legalmente su nombre por Lalisa, «la que es elogiada», por consejo de un adivino.',
      en: 'Lisa was born Pranpriya Manobal and legally changed her name to Lalisa, “the one being praised”, on a fortune teller’s advice.',
      ko: '리사의 본명은 프란프리야 마노반으로, 점술가의 조언에 따라 ‘칭찬받는 사람’이라는 뜻의 라리사로 법적 개명했습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) — https://en.wikipedia.org/wiki/Lisa_(rapper). Consultado 2026-09-13.',
    content: {
      es: 'En 2010, con 13 años, Lisa fue la única seleccionada entre 4.000 aspirantes en una audición de YG Entertainment en Tailandia. Entró en la agencia en abril de 2011.',
      en: 'In 2010, aged 13, Lisa was the only one selected out of 4,000 applicants at a YG Entertainment audition in Thailand. She joined the label in April 2011.',
      ko: '리사는 2010년 13세 때 태국에서 열린 YG 엔터테인먼트 오디션에서 지원자 4,000명 중 유일하게 합격했고, 2011년 4월 YG에 들어갔습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, Rosé (singer) — https://en.wikipedia.org/wiki/Ros%C3%A9_(singer). Consultado 2026-09-13.',
    content: {
      es: 'Rosé quedó primera entre 700 participantes en la audición de YG Entertainment de Sídney, en 2012, y dos meses después se mudó a Seúl como aprendiz.',
      en: 'Rosé came first among 700 participants at the YG Entertainment audition in Sydney in 2012, and two months later moved to Seoul as a trainee.',
      ko: '로제는 2012년 시드니에서 열린 YG 엔터테인먼트 오디션에서 참가자 700명 중 1위를 차지했고, 두 달 뒤 연습생으로 서울에 왔습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jennie',
    verified: true,
    source:
      'Wikipedia, Jennie (singer) — https://en.wikipedia.org/wiki/Jennie_(singer). Consultado 2026-09-13.',
    content: {
      es: 'Jennie estudió en Auckland (Nueva Zelanda) desde los nueve años, en la Waikowhai Intermediate School y el ACG Parnell College, y volvió a Corea en 2010, con 14.',
      en: 'Jennie studied in Auckland, New Zealand, from the age of nine, at Waikowhai Intermediate School and ACG Parnell College, and returned to Korea in 2010, aged 14.',
      ko: '제니는 아홉 살 때부터 뉴질랜드 오클랜드의 와이코와이 인터미디어트 스쿨과 ACG 파넬 칼리지에서 공부했고, 2010년 14세에 한국으로 돌아왔습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, The White Lotus season 3 — https://en.wikipedia.org/wiki/The_White_Lotus_season_3. Consultado 2026-09-13.',
    content: {
      es: 'Lisa forma parte del reparto de la tercera temporada de The White Lotus, estrenada en HBO en febrero de 2025: interpreta a Mook, mentora de bienestar del hotel.',
      en: 'Lisa is part of the cast of the third season of The White Lotus, which premiered on HBO in February 2025, playing Mook, a health mentor at the resort.',
      ko: '리사는 2025년 2월 HBO에서 공개된 The White Lotus 시즌 3에 출연해 리조트의 헬스 멘토 묵 역을 맡았습니다.',
    },
  },

  {
    category: 'MUSIC',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'Whistle y Boombayah salieron a la vez como doble canción principal del debut.',
      en: 'Whistle and Boombayah were released together as the double title track of the debut.',
      ko: 'Whistle와 Boombayah는 데뷔 더블 타이틀곡으로 동시에 발표되었습니다.',
    },
  },
  {
    category: 'MUSIC',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'THE ALBUM, publicado en 2020, fue su primer álbum de estudio completo en coreano.',
      en: 'THE ALBUM, released in 2020, was their first full-length Korean studio album.',
      ko: '2020년에 발표한 THE ALBUM은 그룹의 첫 한국어 정규 앨범입니다.',
    },
  },
  {
    category: 'MUSIC',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'Ice Cream es una colaboración con Selena Gomez incluida en THE ALBUM.',
      en: 'Ice Cream is a collaboration with Selena Gomez included on THE ALBUM.',
      ko: 'Ice Cream은 THE ALBUM에 수록된 셀레나 고메즈와의 협업 곡입니다.',
    },
  },
  {
    category: 'MUSIC',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'Bet You Wanna, de THE ALBUM, cuenta con la colaboración de Cardi B.',
      en: 'Bet You Wanna, from THE ALBUM, features Cardi B.',
      ko: 'THE ALBUM의 수록곡 Bet You Wanna에는 카디 비가 피처링으로 참여했습니다.',
    },
  },
  {
    category: 'MUSIC',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'BORN PINK salió con dos canciones principales: Pink Venom y Shut Down.',
      en: 'BORN PINK was released with two title tracks: Pink Venom and Shut Down.',
      ko: 'BORN PINK는 Pink Venom과 Shut Down의 더블 타이틀로 발표되었습니다.',
    },
  },
  {
    category: 'MUSIC',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'BORN PINK tiene ocho canciones, igual que THE ALBUM.',
      en: 'BORN PINK has eight tracks, the same as THE ALBUM.',
      ko: 'BORN PINK는 THE ALBUM과 마찬가지로 여덟 곡이 수록되어 있습니다.',
    },
  },
  {
    category: 'MUSIC',
    memberSlug: 'jennie',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'Jennie fue la primera integrante en publicar en solitario, con SOLO en 2018.',
      en: 'Jennie was the first member to release solo material, with SOLO in 2018.',
      ko: '제니는 2018년 SOLO로 멤버 중 처음 솔로 음원을 발표했습니다.',
    },
  },
  {
    category: 'MUSIC',
    memberSlug: 'rose',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'El álbum sencillo R, de Rosé, incluye On The Ground y Gone.',
      en: 'Rosé single album R includes On The Ground and Gone.',
      ko: '로제의 싱글 앨범 R에는 On The Ground와 Gone이 수록되어 있습니다.',
    },
  },
  {
    category: 'MUSIC',
    memberSlug: 'lisa',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'El álbum sencillo LALISA, de Lisa, incluye la canción MONEY.',
      en: 'Lisa single album LALISA includes the song MONEY.',
      ko: '리사의 싱글 앨범 LALISA에는 MONEY가 수록되어 있습니다.',
    },
  },
  {
    category: 'MUSIC',
    memberSlug: 'jisoo',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'FLOWER es la canción principal de ME, el debut en solitario de Jisoo en 2023.',
      en: 'FLOWER is the title track of ME, Jisoo solo debut in 2023.',
      ko: 'FLOWER는 2023년 지수의 솔로 데뷔작 ME의 타이틀곡입니다.',
    },
  },
  {
    category: 'MUSIC',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'KILL THIS LOVE salió una semana antes de su primera actuación en Coachella.',
      en: 'KILL THIS LOVE came out a week before their first Coachella performance.',
      ko: 'KILL THIS LOVE는 첫 코첼라 무대 일주일 전에 발표되었습니다.',
    },
  },
  {
    category: 'MUSIC',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'El EP KILL THIS LOVE incluye una versión remezclada de DDU-DU DDU-DU.',
      en: 'The KILL THIS LOVE EP includes a remixed version of DDU-DU DDU-DU.',
      ko: '미니 앨범 KILL THIS LOVE에는 DDU-DU DDU-DU의 리믹스 버전이 수록되어 있습니다.',
    },
  },
  {
    category: 'MUSIC',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, APT. (song) — https://en.wikipedia.org/wiki/APT._(song). Consultado 2026-08-29. Nota: la Wikipedia en español indica 17 de octubre; se adopta el 18 por consenso de fuentes en inglés.',
    content: {
      es: 'Rosé publicó APT., una colaboración con Bruno Mars, el 18 de octubre de 2024.',
      en: 'Rosé released APT., a collaboration with Bruno Mars, on 18 October 2024.',
      ko: '로제가 2024년 10월 18일 브루노 마스와의 협업 곡 APT.를 발표했습니다.',
    },
  },

  {
    category: 'RECORD',
    verified: true,
    source: SOURCES.festival,
    content: {
      es: 'Fueron el primer grupo femenino de K-pop en actuar en Coachella, en 2019.',
      en: 'They were the first K-pop girl group to perform at Coachella, in 2019.',
      ko: '2019년, 코첼라 무대에 선 최초의 K-팝 걸그룹이 되었습니다.',
    },
  },
  {
    category: 'RECORD',
    verified: true,
    source: SOURCES.festival,
    content: {
      es: 'En 2023 se convirtieron en el primer acto de K-pop en encabezar el cartel de Coachella.',
      en: 'In 2023 they became the first K-pop act to headline Coachella.',
      ko: '2023년에는 코첼라 헤드라이너에 오른 최초의 K-팝 그룹이 되었습니다.',
    },
  },
  {
    category: 'RECORD',
    verified: true,
    source: SOURCES.press,
    content: {
      es: 'BORN PINK fue el primer álbum de un grupo femenino de K-pop en llegar al número uno de la lista Billboard 200.',
      en: 'BORN PINK was the first album by a K-pop girl group to reach number one on the Billboard 200.',
      ko: 'BORN PINK는 K-팝 걸그룹 최초로 빌보드 200 1위에 오른 앨범입니다.',
    },
  },
  {
    category: 'RECORD',
    verified: true,
    source: SOURCES.press,
    content: {
      es: 'El videoclip de DDU-DU DDU-DU fue el primero de un grupo femenino de K-pop en superar los mil millones de reproducciones en YouTube.',
      en: 'The DDU-DU DDU-DU music video was the first by a K-pop girl group to pass one billion views on YouTube.',
      ko: 'DDU-DU DDU-DU 뮤직비디오는 K-팝 걸그룹 최초로 YouTube 10억 조회수를 넘겼습니다.',
    },
  },
  {
    category: 'RECORD',
    verified: true,
    source:
      'Wikipedia, How You Like That — https://en.wikipedia.org/wiki/How_You_Like_That. Consultado 2026-09-13.',
    content: {
      es: 'En 2020 el videoclip de How You Like That sumó 86,3 millones de reproducciones en 24 horas y batió cinco Guinness World Records. Fue entonces el vídeo más rápido de YouTube en llegar a 100 millones: 32 horas.',
      en: 'In 2020 the How You Like That video drew 86.3 million views in 24 hours and set five Guinness World Records. At the time it was the fastest video on YouTube to reach 100 million views: 32 hours.',
      ko: '2020년 How You Like That 뮤직비디오는 24시간 만에 8,630만 회 조회되며 기네스 세계 기록 5개를 세웠습니다. 당시 YouTube에서 가장 빠르게 1억 회에 도달한 영상으로, 32시간이 걸렸습니다.',
    },
  },
  {
    category: 'RECORD',
    verified: true,
    source:
      'Wikipedia, The Album (Blackpink album) — https://en.wikipedia.org/wiki/The_Album_(Blackpink_album). Consultado 2026-09-13.',
    content: {
      es: 'THE ALBUM debutó en el número 2 del Billboard 200 en octubre de 2020: la mejor posición de un álbum de artistas femeninas coreanas.',
      en: 'THE ALBUM debuted at number 2 on the Billboard 200 in October 2020, the highest-charting album by a female Korean act.',
      ko: 'THE ALBUM은 2020년 10월 빌보드 200에 2위로 진입하며 한국 여성 아티스트 앨범 최고 순위를 기록했습니다.',
    },
  },
  {
    category: 'RECORD',
    verified: true,
    source:
      'Wikipedia, Born Pink World Tour — https://en.wikipedia.org/wiki/Born_Pink_World_Tour. Consultado 2026-09-13.',
    content: {
      es: 'La gira BORN PINK recaudó 330 millones de dólares en 66 conciertos: es la gira más taquillera de la historia de un grupo femenino.',
      en: 'The BORN PINK tour grossed 330 million dollars over 66 concerts, the highest-grossing concert tour ever by a female group.',
      ko: 'BORN PINK 투어는 66회 공연으로 3억 3천만 달러의 수익을 올려 역대 여성 그룹 투어 중 최고 흥행 기록을 세웠습니다.',
    },
  },
  {
    category: 'RECORD',
    verified: true,
    source:
      'Wikipedia, Blackpink — https://en.wikipedia.org/wiki/Blackpink. Consultado 2026-09-13.',
    content: {
      es: 'Su canal de YouTube es el de un artista musical con más suscriptores, y fue el primero en superar los 100 millones.',
      en: 'Their YouTube channel is the most-subscribed of any music act, and the first to pass 100 million subscribers.',
      ko: '그룹의 YouTube 채널은 음악 아티스트 중 구독자가 가장 많으며, 처음으로 구독자 1억 명을 넘었습니다.',
    },
  },

  {
    category: 'STAGE',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'En enero de 2021 dieron un concierto retransmitido en directo, sin público presencial, durante la pandemia.',
      en: 'In January 2021 they played a livestreamed concert with no in-person audience during the pandemic.',
      ko: '2021년 1월, 팬데믹 기간에 무관중 생중계 콘서트를 열었습니다.',
    },
  },
  {
    category: 'STAGE',
    verified: true,
    source:
      'Wikipedia, Blackpink — https://en.wikipedia.org/wiki/Blackpink. Consultado 2026-09-13.',
    content: {
      es: 'El 2 de julio de 2023 encabezaron el festival BST Hyde Park de Londres: fueron la primera banda coreana en encabezar un gran festival del Reino Unido.',
      en: 'On 2 July 2023 they headlined BST Hyde Park in London, becoming the first Korean band to headline a major UK festival.',
      ko: '2023년 7월 2일 런던 BST 하이드 파크의 헤드라이너로 서며, 영국 대형 페스티벌의 헤드라이너가 된 첫 한국 밴드가 되었습니다.',
    },
  },
  {
    category: 'STAGE',
    verified: true,
    source:
      'Wikipedia, In Your Area World Tour — https://en.wikipedia.org/wiki/In_Your_Area_World_Tour. Consultado 2026-09-13.',
    content: {
      es: 'La primera gira mundial del grupo, IN YOUR AREA, arrancó el 10 de noviembre de 2018 en Seúl.',
      en: 'The first world tour by the group, IN YOUR AREA, began on 10 November 2018 in Seoul.',
      ko: '그룹의 첫 월드 투어 IN YOUR AREA는 2018년 11월 10일 서울에서 시작되었습니다.',
    },
  },

  {
    category: 'OTHER',
    verified: true,
    source: SOURCES.netflix,
    content: {
      es: 'Netflix estrenó en 2020 el documental BLACKPINK: Light Up the Sky.',
      en: 'Netflix premiered the documentary BLACKPINK: Light Up the Sky in 2020.',
      ko: '넷플릭스는 2020년 다큐멘터리 BLACKPINK: Light Up the Sky를 공개했습니다.',
    },
  },
  {
    category: 'OTHER',
    verified: true,
    source:
      'The Royal Family, «The King presents Honorary MBEs to BLACKPINK» — https://www.royal.uk/news-and-activity/2023-11-22/the-king-presents-honorary-mbes-to-blackpink. Consultado 2026-09-13.',
    content: {
      es: 'El 22 de noviembre de 2023 el rey Carlos III les entregó en el Palacio de Buckingham el MBE honorario, por su papel como embajadoras de la cumbre del clima COP26.',
      en: 'On 22 November 2023 King Charles III presented them with honorary MBEs at Buckingham Palace, for their role as advocates for the COP26 climate summit.',
      ko: '2023년 11월 22일 찰스 3세 국왕은 버킹엄궁에서 COP26 기후 정상회의 홍보대사로 활동한 네 멤버에게 명예 MBE를 수여했습니다.',
    },
  },
  {
    category: 'OTHER',
    verified: true,
    source:
      'Wikipedia, Blackpink — https://en.wikipedia.org/wiki/Blackpink. Consultado 2026-09-13. Manila Bulletin — https://mb.com.ph/2024/2/21/blackpink-s-jisoo-launches-own-agency-blissoo-after-jennie-lisa. Billboard Philippines — https://billboardphilippines.com/market/industry-news/blackpinks-rose-signs-with-theblacklabel-yg-entertainment-solo-music-2024/. Consultado 2026-09-13.',
    content: {
      es: 'En diciembre de 2023 renovaron con YG Entertainment solo para las actividades de grupo. Para la carrera en solitario, Jennie creó OA, Lisa LLOUD y Jisoo BLISSOO, y Rosé firmó con THEBLACKLABEL.',
      en: 'In December 2023 they renewed with YG Entertainment for group activities only. For solo work, Jennie founded OA, Lisa LLOUD and Jisoo BLISSOO, while Rosé signed with THEBLACKLABEL.',
      ko: '2023년 12월 멤버들은 그룹 활동에 한해 YG 엔터테인먼트와 재계약했습니다. 솔로 활동을 위해 제니는 OA, 리사는 LLOUD, 지수는 BLISSOO를 세웠고, 로제는 더블랙레이블과 계약했습니다.',
    },
  },
  {
    category: 'OTHER',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'Entre THE ALBUM (2020) y BORN PINK (2022) pasaron casi dos años sin álbum de estudio.',
      en: 'Almost two years passed between THE ALBUM (2020) and BORN PINK (2022) with no studio album.',
      ko: 'THE ALBUM(2020)과 BORN PINK(2022) 사이에는 정규 앨범 없이 약 2년의 공백이 있었습니다.',
    },
  },
  {
    category: 'OTHER',
    verified: true,
    source: SOURCES.discography,
    content: {
      es: 'Las cuatro integrantes completaron su debut en solitario entre 2018 y 2023, en este orden: Jennie, Rosé, Lisa y Jisoo.',
      en: 'All four members completed their solo debut between 2018 and 2023, in this order: Jennie, Rosé, Lisa and Jisoo.',
      ko: '멤버 4인은 2018년부터 2023년까지 제니, 로제, 리사, 지수 순으로 솔로 데뷔를 마쳤습니다.',
    },
  },
  {
    category: 'MUSIC',
    verified: true,
    source:
      'Wikipedia, Deadline (EP) — https://en.wikipedia.org/wiki/Deadline_(EP). Consultado 2026-09-11.',
    content: {
      es: 'El EP DEADLINE (2026) se abre con JUMP, que se había publicado más de siete meses antes como adelanto.',
      en: 'The EP DEADLINE (2026) opens with JUMP, which had come out more than seven months earlier as a pre-release single.',
      ko: 'EP DEADLINE(2026)의 첫 곡 JUMP는 7개월여 앞서 선공개 싱글로 발표된 곡입니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jisoo',
    verified: true,
    source:
      'Wikipedia, Jisoo discography — https://en.wikipedia.org/wiki/Jisoo_discography. Consultado 2026-09-11.',
    content: {
      es: 'Jisoo fundó su propio sello, Blissoo, en febrero de 2024, y con él publicó AMORTAGE y CLICK.',
      en: 'Jisoo founded her own label, Blissoo, in February 2024, and released AMORTAGE and CLICK through it.',
      ko: '지수는 2024년 2월 자신의 레이블 블리수를 설립했고, 이 레이블로 AMORTAGE와 CLICK을 발표했습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jennie',
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Lista de canciones: ficha oficial en Spotify. Consultado 2026-09-11.',
    content: {
      es: 'Ruby, el primer álbum de estudio de Jennie, tiene quince canciones; cinco de ellas con artistas invitados.',
      en: 'Ruby, Jennie first studio album, has fifteen songs; five of them feature guest artists.',
      ko: '제니의 첫 정규 앨범 Ruby에는 15곡이 수록되어 있으며, 그중 5곡에 게스트 아티스트가 참여했습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Lista de canciones: ficha oficial en Spotify. Consultado 2026-09-11.',
    content: {
      es: 'Alter Ego, el primer álbum de estudio de Lisa, incluye dos versiones en solitario de sus propias canciones: FXCK UP THE WORLD y Rapunzel.',
      en: 'Alter Ego, Lisa first studio album, includes solo versions of two of its own songs: FXCK UP THE WORLD and Rapunzel.',
      ko: '리사의 첫 정규 앨범 Alter Ego에는 FXCK UP THE WORLD와 Rapunzel의 솔로 버전이 함께 수록되어 있습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, Rosé discography — https://en.wikipedia.org/wiki/Ros%C3%A9_discography. Consultado 2026-09-11.',
    content: {
      es: 'Rosé grabó Messy para la banda sonora de la película F1, estrenada en 2025.',
      en: 'Rosé recorded Messy for the soundtrack of the film F1, released in 2025.',
      ko: '로제는 2025년 개봉한 영화 F1의 사운드트랙에 Messy를 녹음했습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'lisa',
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Consultado 2026-09-11.',
    content: {
      es: 'Lisa canta Goals con Anitta y Rema, una canción para la Copa Mundial de la FIFA 2026.',
      en: 'Lisa sings Goals with Anitta and Rema, a song for the 2026 FIFA World Cup.',
      ko: '리사는 아니타, 레마와 함께 2026 FIFA 월드컵을 위한 곡 Goals를 불렀습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, One of a Kind (G-Dragon EP) — https://en.wikipedia.org/wiki/One_of_a_Kind_(G-Dragon_EP). Consultado 2026-09-11.',
    content: {
      es: 'Rosé canta en Without You, de G-Dragon, publicada en 2012: cuatro años antes del debut. Entonces se la acreditó como una voz misteriosa del futuro grupo de chicas de YG.',
      en: 'Rosé sings on G-Dragon Without You, released in 2012, four years before the debut. At the time she was credited as a mystery voice from the upcoming YG girl group.',
      ko: '로제는 데뷔 4년 전인 2012년에 발표된 지드래곤의 「결국」(Without You)에 참여했습니다. 당시에는 YG 신인 걸그룹의 비밀 멤버로만 소개되었습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jennie',
    verified: true,
    source:
      "Wikipedia, Coup d'Etat (G-Dragon album) — https://en.wikipedia.org/wiki/Coup_d%27Etat_(G-Dragon_album). Consultado 2026-09-11.",
    content: {
      es: 'Jennie aparece en Black, de G-Dragon, en 2013, acreditada como «Jennie Kim of YG New Girl Group»: aún era aprendiz de YG.',
      en: 'Jennie features on G-Dragon Black in 2013, credited as “Jennie Kim of YG New Girl Group”: she was still a YG trainee.',
      ko: '제니는 2013년 지드래곤의 「Black」에 “Jennie Kim of YG New Girl Group”으로 참여했습니다. 당시 제니는 YG 연습생이었습니다.',
    },
  },
  {
    category: 'MUSIC',
    verified: true,
    source:
      'Wikipedia, Kiss and Make Up (Dua Lipa and Blackpink song) — https://en.wikipedia.org/wiki/Kiss_and_Make_Up_(Dua_Lipa_and_Blackpink_song). Consultado 2026-09-11. Wikipedia, Sour Candy (Lady Gaga and Blackpink song) — https://en.wikipedia.org/wiki/Sour_Candy_(Lady_Gaga_and_Blackpink_song). Consultado 2026-09-11.',
    content: {
      es: 'Además de sus propios discos, BLACKPINK canta en canciones de otras artistas: Kiss and Make Up, de Dua Lipa, y Sour Candy, de Lady Gaga.',
      en: 'Besides its own records, BLACKPINK sings on songs by other artists: Dua Lipa Kiss and Make Up and Lady Gaga Sour Candy.',
      ko: 'BLACKPINK는 자신들의 앨범 외에도 두아 리파의 Kiss and Make Up, 레이디 가가의 Sour Candy에 참여했습니다.',
    },
  },
  {
    category: 'RECORD',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, APT. (song) — https://en.wikipedia.org/wiki/Apt._(song). Consultado 2026-09-13.',
    content: {
      es: 'APT. llegó al número 3 del Billboard Hot 100: Rosé fue la primera artista femenina de K-pop en entrar en el top 10 de esa lista.',
      en: 'APT. reached number 3 on the Billboard Hot 100, making Rosé the first female K-pop act in the top ten of that chart.',
      ko: 'APT.는 빌보드 핫 100에서 3위에 올랐고, 로제는 이 차트 톱 10에 든 첫 K-팝 여성 아티스트가 되었습니다.',
    },
  },
  {
    category: 'RECORD',
    memberSlug: 'rose',
    verified: true,
    source:
      'Wikipedia, APT. (song) — https://en.wikipedia.org/wiki/Apt._(song). Consultado 2026-09-13.',
    content: {
      es: 'Con APT., Rosé fue la primera artista de K-pop en ganar Canción del Año en los MTV Video Music Awards, en 2025.',
      en: 'With APT., Rosé became the first K-pop act to win Song of the Year at the MTV Video Music Awards, in 2025.',
      ko: '로제는 APT.로 2025년 MTV 비디오 뮤직 어워드에서 올해의 노래상을 받은 첫 K-팝 아티스트가 되었습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'rose',
    verified: true,
    source:
      'The Korea Times, «Rosé, Bruno Mars open Grammys with hit single APT.» — https://www.koreatimes.co.kr/entertainment/k-pop/20260202/rose-bruno-mars-open-grammys-with-hit-single-apt. Fecha local de Los Ángeles. Wikipedia, APT. (song) — https://en.wikipedia.org/wiki/Apt._(song). Consultado 2026-09-13.',
    content: {
      es: 'Rosé y Bruno Mars abrieron la gala de los Grammy de 2026 cantando APT., que tenía tres nominaciones.',
      en: 'Rosé and Bruno Mars opened the 2026 Grammy Awards ceremony with APT., which had three nominations.',
      ko: '로제와 브루노 마스는 2026년 그래미 어워드 시상식의 오프닝 무대에서 3개 부문 후보에 오른 APT.를 불렀습니다.',
    },
  },
  {
    category: 'STAGE',
    verified: true,
    source:
      'Wikipedia, Deadline World Tour — https://en.wikipedia.org/wiki/Deadline_World_Tour. Fecha local de cada concierto. Consultado 2026-09-13.',
    content: {
      es: 'DEADLINE fue la primera gira del grupo solo en estadios: 33 conciertos entre julio de 2025 y enero de 2026. Con ella fueron el primer grupo femenino de K-pop en encabezar un concierto en el Citi Field de Nueva York.',
      en: 'DEADLINE was the first all-stadium tour by the group: 33 concerts between July 2025 and January 2026. On it they became the first K-pop girl group to headline Citi Field in New York.',
      ko: 'DEADLINE은 그룹의 첫 스타디움 투어로, 2025년 7월부터 2026년 1월까지 33회 공연을 펼쳤습니다. 이 투어에서 K-팝 걸그룹 최초로 뉴욕 시티 필드의 헤드라이너가 되었습니다.',
    },
  },
  {
    category: 'STAGE',
    verified: true,
    source:
      'Wikipedia, Coachella 2025 — https://en.wikipedia.org/wiki/Coachella_2025. Fecha local de Indio, California. Consultado 2026-09-13.',
    content: {
      es: 'En Coachella 2025 actuaron dos integrantes en solitario: Lisa, en la carpa Sahara, y Jennie, en el Outdoor Theatre.',
      en: 'Two members played Coachella 2025 as soloists: Lisa at the Sahara tent and Jennie at the Outdoor Theatre.',
      ko: '코첼라 2025에는 두 멤버가 솔로로 출연했습니다. 리사는 사하라 텐트, 제니는 아웃도어 시어터 무대에 섰습니다.',
    },
  },
  {
    category: 'GROUP',
    verified: true,
    source:
      'The Korea Times, «BLACKPINK meets fans for 10th anniversary» — https://www.koreatimes.co.kr/entertainment/k-pop/20260809/blackpink-meets-fans-for-10th-anniversary. Consultado 2026-09-13. Korea JoongAng Daily — https://www.koreajoongangdaily.com/entertainment/blackpink-to-launch-heritageinspired-10th-anniversary-merch-with-national-museum-of-korea/12809619. Consultado 2026-09-13.',
    content: {
      es: 'Por su décimo aniversario, el 8 de agosto de 2026, las cuatro se reunieron con 40 fans en el Museo Nacional de Corea, que además lanzó con el grupo una colección de productos inspirada en el patrimonio coreano.',
      en: 'For their tenth anniversary, on 8 August 2026, the four met 40 fans at the National Museum of Korea, which also released a heritage-inspired merchandise collection with the group.',
      ko: '데뷔 10주년인 2026년 8월 8일, 네 멤버는 국립중앙박물관에서 팬 40명을 만났습니다. 박물관은 그룹과 함께 한국 문화유산에서 영감을 받은 굿즈 컬렉션도 선보였습니다.',
    },
  },
];
