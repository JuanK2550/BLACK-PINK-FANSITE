import { day, SOURCES, type Translated } from './common';

/**
 * Fuente comun de las fichas. Se deja explicito que el color de acento NO es
 * informacion oficial, para que nadie lo cite como tal mas adelante.
 */
const MEMBER_SOURCE = `${SOURCES.official} El color de acento es una asignacion de presentacion de este sitio, no un color oficial del grupo.`;

/**
 * ============================================================================
 * LA FOTO Y SU ATRIBUCION
 * ============================================================================
 * Las cuatro fotos son de Wikimedia Commons con licencia **CC BY 3.0**, que
 * exige UNA sola cosa y no exige otra:
 *
 *   EXIGE atribucion: nombre del autor, titulo de la obra, enlace a la
 *   licencia, enlace a la fuente, e indicar si se ha modificado.
 *   NO EXIGE copyleft: no lleva ShareAlike, asi que el resto del sitio no
 *   queda contaminado por la licencia de las fotos.
 *
 * SE HAN MODIFICADO: los archivos servidos estan reescalados a 960px de ancho
 * desde los originales de Commons. La licencia obliga a decirlo, y por eso
 * `imageSource` lo dice y la pagina /creditos tambien.
 *
 * `imageWidth` y `imageHeight` son los del ARCHIVO SERVIDO, no los del
 * original: son las medidas que necesita `next/image` para reservar el hueco.
 * ============================================================================
 */
export interface MemberImageSeed {
  url: string;
  width: number;
  height: number;
  author: string;
  license: string;
  licenseUrl: string;
  /** Pagina del archivo en Commons. */
  source: string;
  /** Cuando se tomo la foto, no cuando se subio. */
  date: Date;
  /** `object-position`. Donde cae la cara en ESTA foto. */
  focus: string;
  /** Alt en los tres idiomas. Describe la foto, no a la persona. */
  alt: Translated;
}

export interface MemberSeed {
  slug: string;
  stageName: string;
  fullName: string;
  koreanName: string;
  birthDate: Date;
  nationality: string;
  position: string;
  colorAccent: string;
  displayOrder: number;
  verified: boolean;
  source: string;
  socials: Record<string, string>;
  image?: MemberImageSeed;
  translations: {
    position: Translated;
    /** Nombre del pais, traducido. Un pais no es un identificador. */
    nationality: Translated;
    nickname: Translated;
    bio: Translated;
    description: Translated;
  };
}

/**
 * Las cuatro integrantes, con sus datos publicos basicos.
 *
 * `colorAccent` NO es un color oficial del grupo: es una asignacion de este
 * sitio para diferenciar las fichas en la interfaz, y su `source` lo dice.
 *
 * `socials` recoge solo cuentas publicas oficiales. Ninguna otra informacion
 * personal entra en este archivo.
 */
export const MEMBERS: MemberSeed[] = [
  {
    slug: 'jisoo',
    stageName: 'JISOO',
    fullName: 'Kim Ji-soo',
    koreanName: '김지수',
    birthDate: day('1995-01-03'),
    nationality: 'Corea del Sur',
    position: 'Vocalista',
    colorAccent: '#c9a7ff',
    displayOrder: 1,
    verified: true,
    source: MEMBER_SOURCE,
    socials: { instagram: 'https://www.instagram.com/sooyaaa__/' },
    image: {
      url: '/integrantes/jisoo.jpg',
      width: 960,
      height: 1311,
      author: 'K-POPIT 케이팝잇',
      license: 'CC BY 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
      source:
        'https://commons.wikimedia.org/wiki/File:20240226_Kim_Jisoo_%EA%B9%80%EC%A7%80%EC%88%98_03.jpg ' +
        '(original 672x918; el archivo servido esta AMPLIADO a 960px de ancho, que no anade detalle: es el unico de los cuatro que sube de tamano en vez de bajar)',
      date: day('2024-02-26'),
      // 0.732 frente al 0.75 del marco: recorta un 2.5% de alto, nada.
      focus: '50% 28%',
      alt: {
        es: 'Jisoo al aire libre, con una chaqueta vaquera azul sobre camiseta blanca, el pelo suelto movido por el viento y una sonrisa leve.',
        en: 'Jisoo outdoors, wearing a blue denim jacket over a white top, her loose hair caught by the wind and a slight smile.',
        ko: '야외에서 흰 티셔츠 위에 청재킷을 입고 바람에 머리가 흩날리는 채로 옅게 미소 짓고 있는 지수.',
      },
    },
    translations: {
      position: { es: 'Vocalista', en: 'Vocalist', ko: '보컬' },
      nationality: { es: 'Corea del Sur', en: 'South Korea', ko: '대한민국' },
      nickname: { es: 'La mayor del grupo', en: 'The eldest member', ko: '맏언니' },
      bio: {
        es: 'Jisoo es la integrante de mayor edad de BLACKPINK y una de las voces del grupo desde el debut en 2016. Compagina la actividad musical con el trabajo como actriz y con su papel de embajadora global de Dior.',
        en: 'Jisoo is the eldest member of BLACKPINK and one of the group vocalists since their 2016 debut. She combines music with acting work and her role as a global ambassador for Dior.',
        ko: '지수는 BLACKPINK의 맏언니이자 2016년 데뷔부터 그룹의 보컬을 맡아 왔습니다. 음악 활동과 함께 배우로도 활동하며 디올의 글로벌 앰배서더를 맡고 있습니다.',
      },
      description: {
        es: 'Vocalista de BLACKPINK. Debut en solitario en 2023 con el álbum sencillo ME.',
        en: 'Vocalist in BLACKPINK. Solo debut in 2023 with the single album ME.',
        ko: 'BLACKPINK의 보컬. 2023년 싱글 앨범 ME로 솔로 데뷔.',
      },
    },
  },
  {
    slug: 'jennie',
    stageName: 'JENNIE',
    fullName: 'Kim Jennie',
    koreanName: '김제니',
    birthDate: day('1996-01-16'),
    nationality: 'Corea del Sur',
    position: 'Rapera y vocalista',
    colorAccent: '#ff2e88',
    displayOrder: 2,
    verified: true,
    source: MEMBER_SOURCE,
    socials: { instagram: 'https://www.instagram.com/jennierubyjane/' },
    image: {
      url: '/integrantes/jennie.jpg',
      width: 960,
      height: 1278,
      author: '티비텐 (TV10)',
      license: 'CC BY 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
      source:
        'https://commons.wikimedia.org/wiki/File:Kim_Jennie_(%EA%B9%80%EC%A0%9C%EB%8B%88)_05.jpg ' +
        '(original 1699x2261, reescalado a 960px de ancho para este sitio)',
      date: day('2023-11-24'),
      // 0.751: coincide con el marco. No se recorta nada.
      focus: '50% 30%',
      alt: {
        es: 'Jennie en un acto público, con un vestido palabra de honor en tono nude y el pelo largo suelto, mirando hacia un lado ante un panel claro.',
        en: 'Jennie at a public event, in a nude strapless dress with her long hair down, looking to one side against a pale backdrop.',
        ko: '공식 행사에서 누드톤 튜브톱 드레스를 입고 긴 머리를 늘어뜨린 채 밝은 배경 앞에서 옆을 바라보는 제니.',
      },
    },
    translations: {
      position: { es: 'Rapera y vocalista', en: 'Rapper and vocalist', ko: '래퍼·보컬' },
      nationality: { es: 'Corea del Sur', en: 'South Korea', ko: '대한민국' },
      nickname: { es: 'La primera en solitario', en: 'First to go solo', ko: '첫 솔로 주자' },
      bio: {
        es: 'Jennie reparte su papel en el grupo entre el rap y la voz. En 2018 se convirtió en la primera integrante en publicar en solitario, con SOLO, y es embajadora global de Chanel.',
        en: 'Jennie splits her role in the group between rapping and singing. In 2018 she became the first member to release solo material, with SOLO, and she is a global ambassador for Chanel.',
        ko: '제니는 그룹 안에서 랩과 보컬을 함께 맡고 있습니다. 2018년 SOLO로 멤버 중 처음 솔로 활동을 시작했으며 샤넬의 글로벌 앰배서더입니다.',
      },
      description: {
        es: 'Rapera y vocalista de BLACKPINK. Primera integrante con lanzamiento en solitario (2018).',
        en: 'Rapper and vocalist in BLACKPINK. First member with a solo release (2018).',
        ko: 'BLACKPINK의 래퍼이자 보컬. 멤버 중 최초로 솔로 음원을 발표(2018).',
      },
    },
  },
  {
    slug: 'rose',
    stageName: 'ROSE',
    fullName: 'Roseanne Park',
    koreanName: '박채영',
    birthDate: day('1997-02-11'),
    nationality: 'Nueva Zelanda',
    position: 'Vocalista principal',
    colorAccent: '#ffc2da',
    displayOrder: 3,
    verified: true,
    source: MEMBER_SOURCE,
    socials: { instagram: 'https://www.instagram.com/roses_are_rosie/' },
    image: {
      url: '/integrantes/rose.jpg',
      width: 960,
      height: 1170,
      author: 'Newsenstar1',
      license: 'CC BY 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
      source:
        'https://commons.wikimedia.org/wiki/File:20190106_(NEWSEN)_%EB%B8%94%EB%9E%99%ED%95%91%ED%81%AC(BLACKPINK)... ' +
        '(Golden Disc Awards 2019) (3) — original 1059x1291, reescalado a 960px de ancho. ' +
        'El titulo del archivo nombra al grupo, pero esta toma es individual: en el encuadre solo aparece Rose.',
      date: day('2019-01-05'),
      // 0.821 frente a 0.75: recorta un 4.7% por cada lado. La cara queda
      // centrada, asi que el 50% horizontal vale.
      focus: '50% 32%',
      alt: {
        es: 'Rose en la alfombra roja de los Golden Disc Awards 2019, con blusa blanca de cuello alto bajo un vestido negro con bordado floral, ante un photocall rosa.',
        en: 'Rose on the red carpet at the 2019 Golden Disc Awards, in a white high-necked blouse under a black dress with floral embroidery, against a pink backdrop.',
        ko: '2019년 골든디스크어워즈 레드카펫에서 분홍색 포토월 앞에 선 로제. 하이넥 흰 블라우스 위에 꽃 자수가 놓인 검은 드레스를 입고 있다.',
      },
    },
    translations: {
      position: { es: 'Vocalista principal', en: 'Main vocalist', ko: '메인 보컬' },
      nationality: { es: 'Nueva Zelanda', en: 'New Zealand', ko: '뉴질랜드' },
      nickname: { es: 'La voz principal', en: 'The lead voice', ko: '메인 보컬' },
      bio: {
        es: 'Rose nació en Nueva Zelanda y se crió en Australia antes de mudarse a Corea del Sur para formarse como artista. Es la vocalista principal del grupo y embajadora global de Saint Laurent. Su nombre artístico viene de su nombre en inglés, Roseanne.',
        en: 'Rose was born in New Zealand and raised in Australia before moving to South Korea to train as an artist. She is the group main vocalist and a global ambassador for Saint Laurent. Her stage name comes from her English name, Roseanne.',
        ko: '로제는 뉴질랜드에서 태어나 호주에서 자란 뒤 한국으로 건너와 연습생 생활을 했습니다. 그룹의 메인 보컬이며 생로랑의 글로벌 앰배서더입니다. 활동명은 영어 이름 Roseanne에서 왔습니다.',
      },
      description: {
        es: 'Vocalista principal de BLACKPINK. Debut en solitario en 2021 con el álbum sencillo R.',
        en: 'Main vocalist in BLACKPINK. Solo debut in 2021 with the single album R.',
        ko: 'BLACKPINK의 메인 보컬. 2021년 싱글 앨범 R로 솔로 데뷔.',
      },
    },
  },
  {
    slug: 'lisa',
    stageName: 'LISA',
    fullName: 'Lalisa Manobal',
    koreanName: '리사',
    birthDate: day('1997-03-27'),
    nationality: 'Tailandia',
    position: 'Rapera y bailarina principal',
    colorAccent: '#ffd76a',
    displayOrder: 4,
    verified: true,
    source: MEMBER_SOURCE,
    socials: { instagram: 'https://www.instagram.com/lalalalisa_m/' },
    image: {
      url: '/integrantes/lisa.jpg',
      width: 960,
      height: 1171,
      author: '티비텐 (TV10)',
      license: 'CC BY 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
      source:
        'https://commons.wikimedia.org/wiki/File:20240314_Lisa_Manoban_12.jpg ' +
        '(original 1020x1244, reescalado a 960px de ancho para este sitio)',
      date: day('2024-03-14'),
      // 0.820: mismo caso que Rose. Recorte lateral pequeno y cara centrada.
      focus: '50% 30%',
      alt: {
        es: 'Lisa sonriendo en un acto público, con flequillo recto, un vestido negro de escote en pico y una gargantilla plateada, sobre un fondo claro desenfocado.',
        en: 'Lisa smiling at a public event, with straight bangs, a black V-neck dress and a silver choker, against a blurred pale background.',
        ko: '공식 행사에서 미소 짓고 있는 리사. 일자 앞머리에 브이넥 검은 드레스와 은색 초커를 착용했고 배경은 밝게 흐려져 있다.',
      },
    },
    translations: {
      position: {
        es: 'Rapera y bailarina principal',
        en: 'Rapper and main dancer',
        ko: '래퍼·메인 댄서',
      },
      nationality: { es: 'Tailandia', en: 'Thailand', ko: '태국' },
      nickname: { es: 'La menor del grupo', en: 'The youngest member', ko: '막내' },
      bio: {
        es: 'Lisa es la integrante más joven y la única que no nació en Corea del Sur: es tailandesa. Dentro del grupo reparte su papel entre el rap y la danza, y es embajadora global de Celine.',
        en: 'Lisa is the youngest member and the only one not born in South Korea: she is Thai. Within the group she splits her role between rapping and dancing, and she is a global ambassador for Celine.',
        ko: '리사는 그룹의 막내이자 유일하게 한국에서 태어나지 않은 멤버로, 태국 출신입니다. 그룹 안에서 랩과 댄스를 함께 맡고 있으며 셀린느의 글로벌 앰배서더입니다.',
      },
      description: {
        es: 'Rapera y bailarina principal de BLACKPINK. Debut en solitario en 2021 con el álbum sencillo LALISA.',
        en: 'Rapper and main dancer in BLACKPINK. Solo debut in 2021 with the single album LALISA.',
        ko: 'BLACKPINK의 래퍼이자 메인 댄서. 2021년 싱글 앨범 LALISA로 솔로 데뷔.',
      },
    },
  },
];
