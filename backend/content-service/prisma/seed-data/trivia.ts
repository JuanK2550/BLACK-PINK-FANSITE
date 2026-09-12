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
      es: 'El grupo lo forman cuatro integrantes: Jisoo, Jennie, Rose y Lisa.',
      en: 'The group has four members: Jisoo, Jennie, Rose and Lisa.',
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
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'Según el grupo, el nombre contradice la idea de que el rosa es lo más bonito. Declaración pendiente de contrastar.',
      en: 'According to the group, the name pushes back on the idea that pink is the prettiest thing. Statement pending verification.',
      ko: '그룹에 따르면 이름에는 분홍이 가장 예쁘다는 통념을 뒤집는 의미가 있다고 합니다. 발언 출처는 확인 대기 중.',
    },
  },
  {
    category: 'GROUP',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'Fue el primer grupo femenino que YG Entertainment presentó tras varios años sin debutar ninguno. Intervalo exacto pendiente de contrastar.',
      en: 'It was the first girl group YG Entertainment introduced after several years without debuting one. Exact gap pending verification.',
      ko: 'YG 엔터테인먼트가 수년 만에 선보인 걸그룹입니다. 정확한 공백 기간은 확인 대기 중.',
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
    verified: false,
    source: SOURCES.pendingDate,
    content: {
      es: 'El nombre del fandom se anunció pocos meses después del debut. Fecha exacta pendiente de contrastar.',
      en: 'The fandom name was announced a few months after the debut. Exact date pending verification.',
      ko: '팬덤 이름은 데뷔 몇 달 뒤에 발표되었습니다. 정확한 날짜는 확인 대기 중.',
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
      es: 'Rose nació en Nueva Zelanda y se crió en Australia antes de mudarse a Corea del Sur.',
      en: 'Rose was born in New Zealand and raised in Australia before moving to South Korea.',
      ko: '로제는 뉴질랜드에서 태어나 호주에서 자란 뒤 한국으로 이주했습니다.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'rose',
    verified: true,
    source: SOURCES.official,
    content: {
      es: 'El nombre artístico de Rose viene de su nombre en inglés, Roseanne.',
      en: 'Rose stage name comes from her English name, Roseanne.',
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
      es: 'Rose es embajadora global de Saint Laurent.',
      en: 'Rose is a global ambassador for Saint Laurent.',
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
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'Lisa cambio su nombre de pila antes de debutar. Detalles pendientes de contrastar.',
      en: 'Lisa changed her given name before debuting. Details pending verification.',
      ko: '리사는 데뷔 전에 이름을 바꾸었습니다. 세부 내용은 확인 대기 중.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'lisa',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'Lisa superó una audición de YG Entertainment celebrada en Tailandia. Año exacto pendiente de contrastar.',
      en: 'Lisa passed a YG Entertainment audition held in Thailand. Exact year pending verification.',
      ko: '리사는 태국에서 열린 YG 엔터테인먼트 오디션에 합격했습니다. 정확한 연도는 확인 대기 중.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'rose',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'Rose superó una audición de YG Entertainment celebrada en Australia. Año exacto pendiente de contrastar.',
      en: 'Rose passed a YG Entertainment audition held in Australia. Exact year pending verification.',
      ko: '로제는 호주에서 열린 YG 엔터테인먼트 오디션에 합격했습니다. 정확한 연도는 확인 대기 중.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'jennie',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'Jennie estudio durante parte de su infancia en Nueva Zelanda. Periodo exacto pendiente de contrastar.',
      en: 'Jennie studied in New Zealand for part of her childhood. Exact period pending verification.',
      ko: '제니는 어린 시절 일부를 뉴질랜드에서 보내며 학교를 다녔습니다. 정확한 시기는 확인 대기 중.',
    },
  },
  {
    category: 'MEMBER',
    memberSlug: 'lisa',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'Lisa formó parte del reparto de la tercera temporada de The White Lotus. Pendiente de contrastar.',
      en: 'Lisa joined the cast of the third season of The White Lotus. Pending verification.',
      ko: '리사가 The White Lotus 시즌 3에 출연했습니다. 확인 대기 중.',
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
      es: 'El álbum sencillo R, de Rose, incluye On The Ground y Gone.',
      en: 'Rose single album R includes On The Ground and Gone.',
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
      es: 'Rose publicó APT., una colaboración con Bruno Mars, el 18 de octubre de 2024.',
      en: 'Rose released APT., a collaboration with Bruno Mars, on 18 October 2024.',
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
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'How You Like That batió varios récords de visualizaciones en 2020. Cifras exactas pendientes de contrastar.',
      en: 'How You Like That broke several viewing records in 2020. Exact figures pending verification.',
      ko: 'How You Like That은 2020년에 여러 조회수 기록을 세웠습니다. 정확한 수치는 확인 대기 중.',
    },
  },
  {
    category: 'RECORD',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'THE ALBUM entró muy alto en la lista Billboard 200 en 2020. Posición exacta pendiente de contrastar.',
      en: 'THE ALBUM entered the Billboard 200 very high in 2020. Exact position pending verification.',
      ko: 'THE ALBUM은 2020년 빌보드 200에 높은 순위로 진입했습니다. 정확한 순위는 확인 대기 중.',
    },
  },
  {
    category: 'RECORD',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'La gira BORN PINK fue una de las más taquilleras de un grupo femenino de K-pop. Cifras pendientes de contrastar.',
      en: 'The BORN PINK tour was among the highest-grossing by a K-pop girl group. Figures pending verification.',
      ko: 'BORN PINK 투어는 K-팝 걸그룹 중 손꼽히는 수익을 올린 투어였습니다. 수치는 확인 대기 중.',
    },
  },
  {
    category: 'RECORD',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'Su canal de YouTube alcanzó una cifra de suscriptores sin precedentes para un artista musical. Cifra y fecha pendientes de contrastar.',
      en: 'Their YouTube channel reached an unprecedented subscriber count for a music artist. Figure and date pending verification.',
      ko: '그룹의 YouTube 채널은 음악 아티스트로서 전례 없는 구독자 수를 기록했습니다. 수치와 시점은 확인 대기 중.',
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
    verified: false,
    source: SOURCES.pendingDate,
    content: {
      es: 'Encabezaron el festival BST Hyde Park de Londres en 2023. Fecha exacta pendiente de contrastar.',
      en: 'They headlined the BST Hyde Park festival in London in 2023. Exact date pending verification.',
      ko: '2023년 런던 BST 하이드 파크 페스티벌의 헤드라이너로 섰습니다. 정확한 날짜는 확인 대기 중.',
    },
  },
  {
    category: 'STAGE',
    verified: false,
    source: SOURCES.pendingDate,
    content: {
      es: 'La primera gira mundial del grupo, IN YOUR AREA, arranco a finales de 2018. Fecha exacta pendiente de contrastar.',
      en: 'The group first world tour, IN YOUR AREA, began in late 2018. Exact date pending verification.',
      ko: '그룹의 첫 월드 투어 IN YOUR AREA는 2018년 말에 시작되었습니다. 정확한 날짜는 확인 대기 중.',
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
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'Las cuatro integrantes recibieron una distinción honorifica británica por su labor divulgativa en la COP26. Detalles pendientes de contrastar.',
      en: 'The four members received a British honorary distinction for their advocacy work at COP26. Details pending verification.',
      ko: '멤버 4인은 COP26 홍보 활동으로 영국의 명예 훈장을 받았습니다. 세부 내용은 확인 대기 중.',
    },
  },
  {
    category: 'OTHER',
    verified: false,
    source: SOURCES.pending,
    content: {
      es: 'En 2024 las cuatro integrantes organizaron sus carreras en solitario con estructuras propias, manteniendo las actividades de grupo con YG Entertainment. Pendiente de contrastar.',
      en: 'In 2024 the four members organised their solo careers through their own structures while keeping group activities with YG Entertainment. Pending verification.',
      ko: '2024년 멤버 4인은 각자의 체제로 솔로 활동을 정비하면서 YG 엔터테인먼트와의 그룹 활동은 유지했습니다. 확인 대기 중.',
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
      es: 'Las cuatro integrantes completaron su debut en solitario entre 2018 y 2023, en este orden: Jennie, Rose, Lisa y Jisoo.',
      en: 'All four members completed their solo debut between 2018 and 2023, in this order: Jennie, Rose, Lisa and Jisoo.',
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
      es: 'Rose grabó Messy para la banda sonora de la película F1, estrenada en 2025.',
      en: 'Rose recorded Messy for the soundtrack of the film F1, released in 2025.',
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
];
