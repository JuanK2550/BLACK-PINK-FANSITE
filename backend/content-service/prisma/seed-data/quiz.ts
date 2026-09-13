// Preguntas del quiz.

import { SOURCES } from './common';

export interface QuizOptionSet {
  es: string[];
  en: string[];
  ko: string[];
}

export interface QuizSeed {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  correctIndex: number;
  verified: boolean;
  source: string;
  question: { es: string; en: string; ko: string };
  options: QuizOptionSet;
  explanation: { es: string; en: string; ko: string };
}

export const QUIZ: QuizSeed[] = [
  {
    difficulty: 'EASY',
    correctIndex: 2,
    verified: true,
    source: SOURCES.official,
    question: {
      es: '¿En qué año debutó BLACKPINK?',
      en: 'In which year did BLACKPINK debut?',
      ko: 'BLACKPINK는 몇 년도에 데뷔했나요?',
    },
    options: {
      es: ['2014', '2015', '2016', '2017'],
      en: ['2014', '2015', '2016', '2017'],
      ko: ['2014년', '2015년', '2016년', '2017년'],
    },
    explanation: {
      es: 'Debutaron el 8 de agosto de 2016 con el álbum sencillo SQUARE ONE.',
      en: 'They debuted on 8 August 2016 with the single album SQUARE ONE.',
      ko: '2016년 8월 8일 싱글 앨범 SQUARE ONE으로 데뷔했습니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 1,
    verified: true,
    source: SOURCES.official,
    question: {
      es: '¿Cuántas integrantes tiene el grupo?',
      en: 'How many members does the group have?',
      ko: '그룹의 멤버는 몇 명인가요?',
    },
    options: {
      es: ['Tres', 'Cuatro', 'Cinco', 'Seis'],
      en: ['Three', 'Four', 'Five', 'Six'],
      ko: ['3명', '4명', '5명', '6명'],
    },
    explanation: {
      es: 'Jisoo, Jennie, Rosé y Lisa.',
      en: 'Jisoo, Jennie, Rosé and Lisa.',
      ko: '지수, 제니, 로제, 리사입니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 0,
    verified: true,
    source: SOURCES.official,
    question: {
      es: '¿Cómo se llama el fandom del grupo?',
      en: 'What is the name of the group fandom?',
      ko: '그룹의 팬덤 이름은 무엇인가요?',
    },
    options: {
      es: ['BLINK', 'PINKY', 'BLACKY', 'ROSIE'],
      en: ['BLINK', 'PINKY', 'BLACKY', 'ROSIE'],
      ko: ['BLINK', 'PINKY', 'BLACKY', 'ROSIE'],
    },
    explanation: {
      es: 'BLINK es la contracción de BLAck y pINK.',
      en: 'BLINK is a contraction of BLAck and pINK.',
      ko: 'BLINK는 BLAck과 pINK를 합친 말입니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 0,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Cuál fue su álbum sencillo de debut?',
      en: 'What was their debut single album?',
      ko: '데뷔 싱글 앨범은 무엇인가요?',
    },
    options: {
      es: ['SQUARE ONE', 'SQUARE TWO', 'SQUARE UP', 'THE ALBUM'],
      en: ['SQUARE ONE', 'SQUARE TWO', 'SQUARE UP', 'THE ALBUM'],
      ko: ['SQUARE ONE', 'SQUARE TWO', 'SQUARE UP', 'THE ALBUM'],
    },
    explanation: {
      es: 'SQUARE ONE salió el 8 de agosto de 2016 con Whistle y Boombayah.',
      en: 'SQUARE ONE was released on 8 August 2016 with Whistle and Boombayah.',
      ko: 'SQUARE ONE은 2016년 8월 8일 Whistle과 Boombayah와 함께 발표되었습니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 0,
    verified: true,
    source: SOURCES.official,
    question: {
      es: '¿Qué integrante es la mayor?',
      en: 'Which member is the eldest?',
      ko: '가장 나이가 많은 멤버는 누구인가요?',
    },
    options: {
      es: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'],
      en: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'],
      ko: ['지수', '제니', '로제', '리사'],
    },
    explanation: {
      es: 'Jisoo nació en enero de 1995.',
      en: 'Jisoo was born in January 1995.',
      ko: '지수는 1995년 1월생입니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 3,
    verified: true,
    source: SOURCES.official,
    question: {
      es: '¿Qué integrante es la más joven?',
      en: 'Which member is the youngest?',
      ko: '가장 어린 멤버는 누구인가요?',
    },
    options: {
      es: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'],
      en: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'],
      ko: ['지수', '제니', '로제', '리사'],
    },
    explanation: {
      es: 'Lisa nació en marzo de 1997.',
      en: 'Lisa was born in March 1997.',
      ko: '리사는 1997년 3월생입니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 1,
    verified: true,
    source: SOURCES.official,
    question: {
      es: '¿De qué país es Lisa?',
      en: 'Which country is Lisa from?',
      ko: '리사는 어느 나라 출신인가요?',
    },
    options: {
      es: ['Japón', 'Tailandia', 'Corea del Sur', 'China'],
      en: ['Japan', 'Thailand', 'South Korea', 'China'],
      ko: ['일본', '태국', '한국', '중국'],
    },
    explanation: {
      es: 'Lisa es la única integrante que no nació en Corea del Sur.',
      en: 'Lisa is the only member not born in South Korea.',
      ko: '리사는 한국에서 태어나지 않은 유일한 멤버입니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 2,
    verified: true,
    source: SOURCES.official,
    question: {
      es: '¿Dónde nació Rosé?',
      en: 'Where was Rosé born?',
      ko: '로제는 어디에서 태어났나요?',
    },
    options: {
      es: ['Australia', 'Corea del Sur', 'Nueva Zelanda', 'Reino Unido'],
      en: ['Australia', 'South Korea', 'New Zealand', 'United Kingdom'],
      ko: ['호주', '한국', '뉴질랜드', '영국'],
    },
    explanation: {
      es: 'Nació en Nueva Zelanda y se crió en Australia.',
      en: 'She was born in New Zealand and raised in Australia.',
      ko: '뉴질랜드에서 태어나 호주에서 자랐습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 1,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Qué integrante publicó primero en solitario?',
      en: 'Which member released solo material first?',
      ko: '가장 먼저 솔로 음원을 발표한 멤버는 누구인가요?',
    },
    options: {
      es: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'],
      en: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'],
      ko: ['지수', '제니', '로제', '리사'],
    },
    explanation: {
      es: 'Jennie publicó SOLO en noviembre de 2018.',
      en: 'Jennie released SOLO in November 2018.',
      ko: '제니가 2018년 11월 SOLO를 발표했습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 0,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Cómo se titula el primer lanzamiento en solitario de Jennie?',
      en: 'What is the title of Jennie first solo release?',
      ko: '제니의 첫 솔로 음원 제목은 무엇인가요?',
    },
    options: {
      es: ['SOLO', 'R', 'LALISA', 'ME'],
      en: ['SOLO', 'R', 'LALISA', 'ME'],
      ko: ['SOLO', 'R', 'LALISA', 'ME'],
    },
    explanation: {
      es: 'SOLO fue el primer lanzamiento en solitario de cualquier integrante.',
      en: 'SOLO was the first solo release by any member.',
      ko: 'SOLO는 멤버 중 최초의 솔로 음원이었습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 2,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Cuál fue su primer álbum de estudio completo en coreano?',
      en: 'What was their first full-length Korean studio album?',
      ko: '첫 한국어 정규 앨범은 무엇인가요?',
    },
    options: {
      es: ['SQUARE UP', 'KILL THIS LOVE', 'THE ALBUM', 'BORN PINK'],
      en: ['SQUARE UP', 'KILL THIS LOVE', 'THE ALBUM', 'BORN PINK'],
      ko: ['SQUARE UP', 'KILL THIS LOVE', 'THE ALBUM', 'BORN PINK'],
    },
    explanation: {
      es: 'THE ALBUM salió en octubre de 2020, cuatro años después del debut.',
      en: 'THE ALBUM came out in October 2020, four years after the debut.',
      ko: 'THE ALBUM은 데뷔 4년 뒤인 2020년 10월에 발표되었습니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 2,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿En qué año se publicó BORN PINK?',
      en: 'In which year was BORN PINK released?',
      ko: 'BORN PINK는 몇 년도에 발매되었나요?',
    },
    options: {
      es: ['2020', '2021', '2022', '2023'],
      en: ['2020', '2021', '2022', '2023'],
      ko: ['2020년', '2021년', '2022년', '2023년'],
    },
    explanation: {
      es: 'BORN PINK salió el 16 de septiembre de 2022.',
      en: 'BORN PINK was released on 16 September 2022.',
      ko: 'BORN PINK는 2022년 9월 16일에 발매되었습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 1,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Con qué artista colaboran en Ice Cream?',
      en: 'Which artist do they collaborate with on Ice Cream?',
      ko: 'Ice Cream에서 함께한 아티스트는 누구인가요?',
    },
    options: {
      es: ['Dua Lipa', 'Selena Gomez', 'Cardi B', 'Lady Gaga'],
      en: ['Dua Lipa', 'Selena Gomez', 'Cardi B', 'Lady Gaga'],
      ko: ['두아 리파', '셀레나 고메즈', '카디 비', '레이디 가가'],
    },
    explanation: {
      es: 'Ice Cream está incluida en THE ALBUM.',
      en: 'Ice Cream is included on THE ALBUM.',
      ko: 'Ice Cream은 THE ALBUM에 수록되어 있습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 0,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Quién colabora en Bet You Wanna?',
      en: 'Who features on Bet You Wanna?',
      ko: 'Bet You Wanna에 피처링으로 참여한 사람은 누구인가요?',
    },
    options: {
      es: ['Cardi B', 'Selena Gomez', 'Doja Cat', 'Megan Thee Stallion'],
      en: ['Cardi B', 'Selena Gomez', 'Doja Cat', 'Megan Thee Stallion'],
      ko: ['카디 비', '셀레나 고메즈', '도자 캣', '메건 디 스탤리언'],
    },
    explanation: {
      es: 'Bet You Wanna es la cuarta canción de THE ALBUM.',
      en: 'Bet You Wanna is the fourth track on THE ALBUM.',
      ko: 'Bet You Wanna는 THE ALBUM의 네 번째 트랙입니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 2,
    verified: true,
    source: SOURCES.festival,
    question: {
      es: '¿En qué año actuaron por primera vez en Coachella?',
      en: 'In which year did they first perform at Coachella?',
      ko: '코첼라에 처음 선 해는 언제인가요?',
    },
    options: {
      es: ['2017', '2018', '2019', '2020'],
      en: ['2017', '2018', '2019', '2020'],
      ko: ['2017년', '2018년', '2019년', '2020년'],
    },
    explanation: {
      es: 'Fueron el primer grupo femenino de K-pop en actuar en el festival.',
      en: 'They were the first K-pop girl group to perform at the festival.',
      ko: '페스티벌 무대에 선 최초의 K-팝 걸그룹이었습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 2,
    verified: true,
    source: SOURCES.festival,
    question: {
      es: '¿En qué año encabezaron el cartel de Coachella?',
      en: 'In which year did they headline Coachella?',
      ko: '코첼라 헤드라이너로 선 해는 언제인가요?',
    },
    options: {
      es: ['2021', '2022', '2023', '2024'],
      en: ['2021', '2022', '2023', '2024'],
      ko: ['2021년', '2022년', '2023년', '2024년'],
    },
    explanation: {
      es: 'Fueron el primer acto de K-pop en encabezar el festival.',
      en: 'They were the first K-pop act to headline the festival.',
      ko: '페스티벌 헤드라이너에 오른 최초의 K-팝 그룹이었습니다.',
    },
  },
  {
    difficulty: 'HARD',
    correctIndex: 1,
    verified: true,
    source: SOURCES.press,
    question: {
      es: '¿Qué videoclip fue el primero de un grupo femenino de K-pop en superar los mil millones de reproducciones en YouTube?',
      en: 'Which music video was the first by a K-pop girl group to pass one billion YouTube views?',
      ko: 'K-팝 걸그룹 최초로 YouTube 10억 조회수를 넘긴 뮤직비디오는 무엇인가요?',
    },
    options: {
      es: ['Boombayah', 'DDU-DU DDU-DU', 'Kill This Love', 'How You Like That'],
      en: ['Boombayah', 'DDU-DU DDU-DU', 'Kill This Love', 'How You Like That'],
      ko: ['Boombayah', 'DDU-DU DDU-DU', 'Kill This Love', 'How You Like That'],
    },
    explanation: {
      es: 'DDU-DU DDU-DU es la canción principal del EP SQUARE UP.',
      en: 'DDU-DU DDU-DU is the title track of the SQUARE UP EP.',
      ko: 'DDU-DU DDU-DU는 미니 앨범 SQUARE UP의 타이틀곡입니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 0,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Cuál es la canción principal del debut en solitario de Jisoo?',
      en: 'What is the title track of Jisoo solo debut?',
      ko: '지수 솔로 데뷔작의 타이틀곡은 무엇인가요?',
    },
    options: {
      es: ['FLOWER', 'All Eyes On Me', 'Gone', 'MONEY'],
      en: ['FLOWER', 'All Eyes On Me', 'Gone', 'MONEY'],
      ko: ['FLOWER', 'All Eyes On Me', 'Gone', 'MONEY'],
    },
    explanation: {
      es: 'FLOWER es la canción principal del álbum sencillo ME, de 2023.',
      en: 'FLOWER is the title track of the 2023 single album ME.',
      ko: 'FLOWER는 2023년 싱글 앨범 ME의 타이틀곡입니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 1,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿En qué EP se incluye la canción Kill This Love?',
      en: 'Which EP includes the song Kill This Love?',
      ko: 'Kill This Love가 수록된 미니 앨범은 무엇인가요?',
    },
    options: {
      es: ['SQUARE UP', 'KILL THIS LOVE', 'THE ALBUM', 'BORN PINK'],
      en: ['SQUARE UP', 'KILL THIS LOVE', 'THE ALBUM', 'BORN PINK'],
      ko: ['SQUARE UP', 'KILL THIS LOVE', 'THE ALBUM', 'BORN PINK'],
    },
    explanation: {
      es: 'El EP KILL THIS LOVE salió en abril de 2019.',
      en: 'The KILL THIS LOVE EP came out in April 2019.',
      ko: '미니 앨범 KILL THIS LOVE는 2019년 4월에 발표되었습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 2,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Cuáles son las dos canciones principales de BORN PINK?',
      en: 'What are the two title tracks of BORN PINK?',
      ko: 'BORN PINK의 더블 타이틀곡은 무엇인가요?',
    },
    options: {
      es: [
        'Typa Girl y Tally',
        'Hard to Love y Ready For Love',
        'Pink Venom y Shut Down',
        'Yeah Yeah Yeah y The Happiest Girl',
      ],
      en: [
        'Typa Girl and Tally',
        'Hard to Love and Ready For Love',
        'Pink Venom and Shut Down',
        'Yeah Yeah Yeah and The Happiest Girl',
      ],
      ko: [
        'Typa Girl과 Tally',
        'Hard to Love와 Ready For Love',
        'Pink Venom과 Shut Down',
        'Yeah Yeah Yeah와 The Happiest Girl',
      ],
    },
    explanation: {
      es: 'Pink Venom se publicó un mes antes que el álbum completo.',
      en: 'Pink Venom was released a month before the full album.',
      ko: 'Pink Venom은 정규 앨범보다 한 달 앞서 공개되었습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 3,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Qué dos canciones formaron el doble sencillo de debut?',
      en: 'Which two songs made up the double debut single?',
      ko: '데뷔 더블 타이틀곡은 어떤 두 곡인가요?',
    },
    options: {
      es: [
        'Playing with Fire y Stay',
        'Whistle y Really',
        'Boombayah y Forever Young',
        'Whistle y Boombayah',
      ],
      en: [
        'Playing with Fire and Stay',
        'Whistle and Really',
        'Boombayah and Forever Young',
        'Whistle and Boombayah',
      ],
      ko: [
        'Playing with Fire와 Stay',
        'Whistle와 Really',
        'Boombayah와 Forever Young',
        'Whistle와 Boombayah',
      ],
    },
    explanation: {
      es: 'Las dos salieron a la vez en SQUARE ONE.',
      en: 'Both were released at the same time on SQUARE ONE.',
      ko: '두 곡 모두 SQUARE ONE에 동시에 실렸습니다.',
    },
  },
  {
    difficulty: 'HARD',
    correctIndex: 1,
    verified: true,
    source: SOURCES.netflix,
    question: {
      es: '¿Cómo se titula el documental que Netflix estrenó sobre el grupo en 2020?',
      en: 'What is the title of the documentary Netflix premiered about the group in 2020?',
      ko: '2020년 넷플릭스가 공개한 그룹 다큐멘터리의 제목은 무엇인가요?',
    },
    options: {
      es: ['In Your Area', 'Light Up the Sky', 'Born Pink', 'The Show'],
      en: ['In Your Area', 'Light Up the Sky', 'Born Pink', 'The Show'],
      ko: ['In Your Area', 'Light Up the Sky', 'Born Pink', 'The Show'],
    },
    explanation: {
      es: 'El título completo es BLACKPINK: Light Up the Sky.',
      en: 'The full title is BLACKPINK: Light Up the Sky.',
      ko: '정식 제목은 BLACKPINK: Light Up the Sky입니다.',
    },
  },
  {
    difficulty: 'HARD',
    correctIndex: 2,
    verified: true,
    source: SOURCES.press,
    question: {
      es: '¿Qué álbum los llevó al número uno de la lista Billboard 200?',
      en: 'Which album took them to number one on the Billboard 200?',
      ko: '빌보드 200 1위에 오른 앨범은 무엇인가요?',
    },
    options: {
      es: ['SQUARE UP', 'KILL THIS LOVE', 'BORN PINK', 'THE ALBUM'],
      en: ['SQUARE UP', 'KILL THIS LOVE', 'BORN PINK', 'THE ALBUM'],
      ko: ['SQUARE UP', 'KILL THIS LOVE', 'BORN PINK', 'THE ALBUM'],
    },
    explanation: {
      es: 'Fue el primer álbum de un grupo femenino de K-pop en encabezar esa lista.',
      en: 'It was the first album by a K-pop girl group to top that chart.',
      ko: 'K-팝 걸그룹 최초로 해당 차트 정상에 오른 앨범이었습니다.',
    },
  },
  {
    difficulty: 'HARD',
    correctIndex: 1,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿En qué orden debutaron en solitario las cuatro integrantes?',
      en: 'In which order did the four members make their solo debuts?',
      ko: '멤버 4인의 솔로 데뷔 순서는 어떻게 되나요?',
    },
    options: {
      es: [
        'Rosé, Jennie, Jisoo, Lisa',
        'Jennie, Rosé, Lisa, Jisoo',
        'Jennie, Lisa, Rosé, Jisoo',
        'Jisoo, Jennie, Rosé, Lisa',
      ],
      en: [
        'Rosé, Jennie, Jisoo, Lisa',
        'Jennie, Rosé, Lisa, Jisoo',
        'Jennie, Lisa, Rosé, Jisoo',
        'Jisoo, Jennie, Rosé, Lisa',
      ],
      ko: [
        '로제, 제니, 지수, 리사',
        '제니, 로제, 리사, 지수',
        '제니, 리사, 로제, 지수',
        '지수, 제니, 로제, 리사',
      ],
    },
    explanation: {
      es: 'Jennie en 2018, Rosé en marzo de 2021, Lisa en septiembre de 2021 y Jisoo en 2023.',
      en: 'Jennie in 2018, Rosé in March 2021, Lisa in September 2021 and Jisoo in 2023.',
      ko: '제니 2018년, 로제 2021년 3월, 리사 2021년 9월, 지수 2023년입니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 0,
    verified: true,
    source: SOURCES.discography,
    question: {
      es: '¿Cuántas canciones tiene BORN PINK?',
      en: 'How many tracks does BORN PINK have?',
      ko: 'BORN PINK에는 몇 곡이 수록되어 있나요?',
    },
    options: {
      es: ['Ocho', 'Seis', 'Diez', 'Doce'],
      en: ['Eight', 'Six', 'Ten', 'Twelve'],
      ko: ['8곡', '6곡', '10곡', '12곡'],
    },
    explanation: {
      es: 'Las mismas ocho que THE ALBUM.',
      en: 'The same eight as THE ALBUM.',
      ko: 'THE ALBUM과 같은 여덟 곡입니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 0,
    verified: true,
    source:
      'Wikipedia, Deadline (EP) — https://en.wikipedia.org/wiki/Deadline_(EP). Consultado 2026-09-11.',
    question: {
      es: '¿Qué canción adelantó el EP DEADLINE?',
      en: 'Which song came out ahead of the EP DEADLINE?',
      ko: 'EP DEADLINE의 선공개 싱글은?',
    },
    options: {
      es: ['JUMP', 'GO', 'Champion', 'Fxxxboy'],
      en: ['JUMP', 'GO', 'Champion', 'Fxxxboy'],
      ko: ['JUMP', 'GO', 'Champion', 'Fxxxboy'],
    },
    explanation: {
      es: 'JUMP salió en julio de 2025, siete meses antes que el EP.',
      en: 'JUMP came out in July 2025, seven months before the EP.',
      ko: 'JUMP는 EP보다 7개월 앞선 2025년 7월에 발표되었습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 2,
    verified: true,
    source:
      'Wikipedia, Deadline (EP) — https://en.wikipedia.org/wiki/Deadline_(EP). Consultado 2026-09-11.',
    question: {
      es: '¿Cuál es la canción principal del EP DEADLINE?',
      en: 'What is the title track of the EP DEADLINE?',
      ko: 'EP DEADLINE의 타이틀곡은?',
    },
    options: {
      es: ['Champion', 'Me and my', 'GO', 'Fxxxboy'],
      en: ['Champion', 'Me and my', 'GO', 'Fxxxboy'],
      ko: ['Champion', 'Me and my', 'GO', 'Fxxxboy'],
    },
    explanation: {
      es: 'GO es la canción principal; JUMP fue el adelanto.',
      en: 'GO is the title track; JUMP was the pre-release single.',
      ko: '타이틀곡은 GO이며, JUMP는 선공개 싱글이었습니다.',
    },
  },
  {
    difficulty: 'HARD',
    correctIndex: 1,
    verified: true,
    source:
      'Wikipedia, Deadline (EP) — https://en.wikipedia.org/wiki/Deadline_(EP). Lista de canciones: ficha oficial en Spotify. Consultado 2026-09-11.',
    question: {
      es: '¿Cuántas canciones tiene el EP DEADLINE?',
      en: 'How many songs does the EP DEADLINE have?',
      ko: 'EP DEADLINE에는 몇 곡이 수록되어 있나요?',
    },
    options: {
      es: ['Cuatro', 'Cinco', 'Seis', 'Ocho'],
      en: ['Four', 'Five', 'Six', 'Eight'],
      ko: ['4곡', '5곡', '6곡', '8곡'],
    },
    explanation: {
      es: 'JUMP, GO, Me and my, Champion y Fxxxboy.',
      en: 'JUMP, GO, Me and my, Champion and Fxxxboy.',
      ko: 'JUMP, GO, Me and my, Champion, Fxxxboy입니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 3,
    verified: true,
    source:
      'Wikipedia, Jisoo discography — https://en.wikipedia.org/wiki/Jisoo_discography. Consultado 2026-09-11.',
    question: {
      es: '¿Con qué artista canta Jisoo EYES CLOSED?',
      en: 'Which artist sings EYES CLOSED with Jisoo?',
      ko: '지수와 EYES CLOSED를 함께 부른 아티스트는?',
    },
    options: {
      es: ['Bruno Mars', 'Future', 'Tyla', 'ZAYN'],
      en: ['Bruno Mars', 'Future', 'Tyla', 'ZAYN'],
      ko: ['브루노 마스', '퓨처', '타일라', '제인'],
    },
    explanation: {
      es: 'Es un dueto con el cantante inglés ZAYN, de 2025.',
      en: 'It is a 2025 duet with English singer ZAYN.',
      ko: '영국 가수 제인과의 2025년 듀엣곡입니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 1,
    verified: true,
    source:
      'Wikipedia, Jisoo discography — https://en.wikipedia.org/wiki/Jisoo_discography. Consultado 2026-09-11.',
    question: {
      es: '¿Qué integrante publicó el sencillo CLICK en 2026?',
      en: 'Which member released the single CLICK in 2026?',
      ko: '2026년 싱글 CLICK을 발표한 멤버는?',
    },
    options: {
      es: ['Lisa', 'Jisoo', 'Rosé', 'Jennie'],
      en: ['Lisa', 'Jisoo', 'Rosé', 'Jennie'],
      ko: ['리사', '지수', '로제', '제니'],
    },
    explanation: {
      es: 'Jisoo lo publicó en septiembre de 2026 con su sello Blissoo.',
      en: 'Jisoo released it in September 2026 through her label Blissoo.',
      ko: '지수가 2026년 9월 자신의 레이블 블리수를 통해 발표했습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 0,
    verified: true,
    source:
      'Wikipedia, Jennie discography — https://en.wikipedia.org/wiki/Jennie_discography. Consultado 2026-09-11.',
    question: {
      es: '¿Cómo se llama el primer álbum de estudio de Jennie?',
      en: 'What is the name of Jennie first studio album?',
      ko: '제니의 첫 정규 앨범 이름은?',
    },
    options: {
      es: ['Ruby', 'rosie', 'Alter Ego', 'AMORTAGE'],
      en: ['Ruby', 'rosie', 'Alter Ego', 'AMORTAGE'],
      ko: ['Ruby', 'rosie', 'Alter Ego', 'AMORTAGE'],
    },
    explanation: {
      es: 'Ruby salió en marzo de 2025.',
      en: 'Ruby came out in March 2025.',
      ko: 'Ruby는 2025년 3월에 발표되었습니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 2,
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Consultado 2026-09-11.',
    question: {
      es: '¿Cómo se llama el primer álbum de estudio de Lisa?',
      en: 'What is the name of Lisa first studio album?',
      ko: '리사의 첫 정규 앨범 이름은?',
    },
    options: {
      es: ['LALISA', 'Ruby', 'Alter Ego', 'ROCKSTAR'],
      en: ['LALISA', 'Ruby', 'Alter Ego', 'ROCKSTAR'],
      ko: ['LALISA', 'Ruby', 'Alter Ego', 'ROCKSTAR'],
    },
    explanation: {
      es: 'Alter Ego salió en febrero de 2025. LALISA fue su álbum sencillo de debut.',
      en: 'Alter Ego came out in February 2025. LALISA was her debut single album.',
      ko: 'Alter Ego는 2025년 2월에 발표되었고, LALISA는 데뷔 싱글 앨범이었습니다.',
    },
  },
  {
    difficulty: 'HARD',
    correctIndex: 3,
    verified: true,
    source:
      'Wikipedia, Lisa (rapper) discography — https://en.wikipedia.org/wiki/Lisa_(rapper)_discography. Consultado 2026-09-11.',
    question: {
      es: '¿Para qué acontecimiento es la canción Goals, de Lisa con Anitta y Rema?',
      en: 'What event is the song Goals, by Lisa with Anitta and Rema, for?',
      ko: '리사, 아니타, 레마의 곡 Goals는 어떤 행사를 위한 곡인가요?',
    },
    options: {
      es: [
        'Los Juegos Olímpicos de 2028',
        'La Super Bowl',
        'Los premios Grammy',
        'La Copa Mundial de la FIFA 2026',
      ],
      en: [
        'The 2028 Olympic Games',
        'The Super Bowl',
        'The Grammy Awards',
        'The 2026 FIFA World Cup',
      ],
      ko: ['2028 올림픽', '슈퍼볼', '그래미 어워즈', '2026 FIFA 월드컵'],
    },
    explanation: {
      es: 'Es una canción para la Copa Mundial de la FIFA 2026.',
      en: 'It is a song for the 2026 FIFA World Cup.',
      ko: '2026 FIFA 월드컵을 위한 곡입니다.',
    },
  },
  {
    difficulty: 'EASY',
    correctIndex: 1,
    verified: true,
    source:
      'Wikipedia, Kiss and Make Up (Dua Lipa and Blackpink song) — https://en.wikipedia.org/wiki/Kiss_and_Make_Up_(Dua_Lipa_and_Blackpink_song). Consultado 2026-09-11.',
    question: {
      es: '¿Con qué artista canta BLACKPINK Kiss and Make Up?',
      en: 'Which artist does BLACKPINK sing Kiss and Make Up with?',
      ko: 'BLACKPINK가 Kiss and Make Up을 함께 부른 아티스트는 누구인가요?',
    },
    options: {
      es: ['Lady Gaga', 'Dua Lipa', 'Selena Gomez', 'Cardi B'],
      en: ['Lady Gaga', 'Dua Lipa', 'Selena Gomez', 'Cardi B'],
      ko: ['레이디 가가', '두아 리파', '셀레나 고메즈', '카디 비'],
    },
    explanation: {
      es: 'Kiss and Make Up es una canción de Dua Lipa con BLACKPINK, publicada en octubre de 2018.',
      en: 'Kiss and Make Up is a song by Dua Lipa with BLACKPINK, released in October 2018.',
      ko: 'Kiss and Make Up은 2018년 10월에 발표된 두아 리파와 BLACKPINK의 곡입니다.',
    },
  },
  {
    difficulty: 'MEDIUM',
    correctIndex: 0,
    verified: true,
    source:
      'Wikipedia, Sour Candy (Lady Gaga and Blackpink song) — https://en.wikipedia.org/wiki/Sour_Candy_(Lady_Gaga_and_Blackpink_song). Consultado 2026-09-11.',
    question: {
      es: '¿En qué álbum de Lady Gaga está Sour Candy, su canción con BLACKPINK?',
      en: 'Which Lady Gaga album includes Sour Candy, her song with BLACKPINK?',
      ko: '레이디 가가와 BLACKPINK의 곡 Sour Candy가 수록된 앨범은 무엇인가요?',
    },
    options: {
      es: ['Chromatica', 'Joanne', 'Mayhem', 'Born This Way'],
      en: ['Chromatica', 'Joanne', 'Mayhem', 'Born This Way'],
      ko: ['Chromatica', 'Joanne', 'Mayhem', 'Born This Way'],
    },
    explanation: {
      es: 'Sour Candy salió en mayo de 2020 como sencillo promocional de Chromatica.',
      en: 'Sour Candy came out in May 2020 as a promotional single from Chromatica.',
      ko: 'Sour Candy는 2020년 5월 Chromatica의 프로모션 싱글로 발표되었습니다.',
    },
  },
  {
    difficulty: 'HARD',
    correctIndex: 2,
    verified: true,
    source:
      'Wikipedia, One of a Kind (G-Dragon EP) — https://en.wikipedia.org/wiki/One_of_a_Kind_(G-Dragon_EP). Consultado 2026-09-11.',
    question: {
      es: '¿Qué integrante canta en Without You, de G-Dragon, cuatro años antes del debut?',
      en: 'Which member sings on G-Dragon Without You, four years before the debut?',
      ko: '데뷔 4년 전 지드래곤의 「결국」(Without You)에 참여한 멤버는 누구인가요?',
    },
    options: {
      es: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'],
      en: ['Jisoo', 'Jennie', 'Rosé', 'Lisa'],
      ko: ['지수', '제니', '로제', '리사'],
    },
    explanation: {
      es: 'Era Rosé, aunque entonces solo se la acreditó como una voz del futuro grupo de chicas de YG.',
      en: 'It was Rosé, although at the time she was only credited as a voice from the upcoming YG girl group.',
      ko: '로제였지만, 당시에는 YG 신인 걸그룹의 목소리로만 소개되었습니다.',
    },
  },
];
