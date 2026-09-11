/**
 * ============================================================================
 * ACOPIO DE IMAGENES DESDE WIKIMEDIA COMMONS
 * ============================================================================
 * Busca en Commons, filtra por licencia, descarga lo que pasa el filtro y
 * vuelca los metadatos a un JSON versionado.
 *
 *   node infra/scripts/commons-gallery.mjs            ejecucion en seco
 *   node infra/scripts/commons-gallery.mjs --write    descarga y vuelca
 *   node infra/scripts/commons-gallery.mjs --check    volcado contra disco
 *
 * NO NECESITA CLAVE. La API de Commons es publica; solo pide un `User-Agent`
 * que identifique a quien llama, y eso lo exige su politica de uso.
 *
 * SE BUSCA POR CATEGORIA, NO POR TEXTO LIBRE. Una busqueda de texto por
 * "BLACKPINK" devuelve carteles, entradas y fotos de un escenario vacio; las
 * categorias de Commons las mantienen personas y dicen QUIEN sale en la foto.
 * De ahi sale ademas el unico filtro por integrante que los datos soportan de
 * verdad: la categoria de la que vino cada archivo.
 *
 * EL FILTRO DE LICENCIA ES LO QUE HACE PUBLICABLE ESTE MATERIAL, y por eso es
 * una LISTA BLANCA de licencias conocidas, nunca una lista negra. Commons
 * aloja tambien material de uso legitimo restringido, fotos con marca de
 * agencia y logotipos con copyright: lo que no reconozca el patron se
 * descarta, y el informe dice cuantas y por que.
 *
 * SE GUARDAN LAS DIMENSIONES REALES DEL ARCHIVO SERVIDO, no las que declara la
 * API del original. Es la misma leccion que las portadas de Spotify: sin las
 * medidas de lo que de verdad se sirve, la rejilla salta al cargar.
 * ============================================================================
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');

/** Carpeta publica donde acaban los archivos. */
const DESTINO = path.join(RAIZ, 'apps', 'web', 'public', 'galeria');
/** El volcado versionado, hermano de los de Spotify. */
const VOLCADO = path.join(
  RAIZ,
  'services',
  'content-service',
  'prisma',
  'seed-data',
  'commons-gallery.json',
);

/**
 * La politica de la API pide identificarse. Un `User-Agent` generico es la via
 * rapida a que te corten el acceso, y con razon: sin el no hay a quien avisar.
 */
const USER_AGENT =
  'BlackpinkFansite/1.0 (sitio de fans no oficial; https://github.com/JuanK2550) node-fetch';

const API = 'https://commons.wikimedia.org/w/api.php';

/**
 * De donde se saca cada cosa.
 *
 * `subject` es el filtro por integrante de la pagina, y sale de AQUI y no de
 * adivinar nombres en el titulo del archivo: la categoria ya dice quien sale.
 */
const FUENTES = [
  { subject: 'grupo', prefijo: 'Blackpink' },
  /*
   * OJO CON LOS NOMBRES. Commons no usa el nombre por el que se las conoce:
   *   Jisoo  -> Category:Jisoo            («Kim Ji-soo (singer)» existe VACIA)
   *   Lisa   -> Category:Lisa (Thai vocalist)
   *            («Lisa Manoban» y «Lalisa Manobal» existen y estan VACIAS)
   * Buscar por el nombre evidente devolvia cero fotos de dos integrantes.
   */
  { subject: 'jisoo', prefijo: 'Jisoo', excluir: /\(member of tahiti\)/i },
  { subject: 'jennie', prefijo: 'Jennie Kim' },
  { subject: 'rose', prefijo: 'Rosé Park' },
  { subject: 'lisa', prefijo: 'Lisa (Thai vocalist)' },
];

/**
 * CATEGORIAS Y TITULOS VETADOS, y no por licencia.
 *
 * Commons aloja portadas y logotipos del grupo con etiquetas de dominio
 * publico que aqui NO valen: la regla 1 del proyecto dice que este sitio no
 * aloja material con copyright, y una portada lo es aunque alguien la haya
 * subido marcada como PD-textlogo. Esta galeria es de FOTOGRAFIAS.
 *
 * El informe cuenta lo que quita por esta via: si algun dia entra algo por un
 * camino nuevo, se ve en el recuento en vez de aparecer publicado.
 */
const CATEGORIAS_VETADAS = [/logos?$/i, /album covers/i, /discograph/i];

/*
 * LOS PARENTESIS Y LOS LIMITES DE PALABRA SON LA MITAD DEL PATRON.
 *
 * Sin ellos -se perdieron en una edicion y el informe lo delato- «ep»
 * casaba dentro de «premiere» y de «September», y el veto se llevaba por
 * delante 27 fotografias legitimas etiquetandolas de portada. Un filtro de
 * seguridad que descarta de mas miente igual que uno que descarta de menos.
 */
const TITULOS_VETADOS = /\((ep|single|album|mini album)\)|\b(cover|logo|wordmark|tracklist)\b/i;

/**
 * DESCRIPCIONES QUE DELATAN ALGO QUE NO ES UNA FOTOGRAFIA PROPIA.
 *
 * Commons acepta capturas de video y de redes sociales; este sitio no las
 * publica, y no por estilo. Una captura de un video de YouTube es una obra
 * derivada de ese video: la etiqueta CC del archivo describe el recorte, no
 * los derechos del original, y la regla 1 del proyecto dice que aqui no se
 * aloja material con copyright. Un collage tampoco es una fotografia: es un
 * montaje de varias, cada una con su licencia.
 *
 * Salieron en la revision de las sesenta finalistas: tres capturas de YouTube,
 * una de Instagram y un collage.
 */
const DESCRIPCIONES_VETADAS =
  /captured picture|screenshot|captura de pantalla|youtube\.com|youtu\.be|instagram|collage|montage/i;

/**
 * LICENCIAS ACEPTADAS.
 *
 * Solo lo que permite alojar y adaptar con atribucion, o lo que ya es libre:
 * CC BY, CC BY-SA, CC0 y dominio publico. Todo lo demas se descarta, incluidas
 * las variantes NC (no comercial) y ND (sin obra derivada): reescalar una foto
 * ES una obra derivada, asi que una ND no se podria ni preparar para la web.
 *
 * Se compara contra `LicenseShortName` normalizado. Una lista blanca de
 * patrones y no una negra: una licencia que no se reconozca no entra.
 */
/**
 * PRUEBA DE PERTENENCIA: el archivo tiene que NOMBRAR a quien dice retratar.
 *
 * Estar dentro de «Category:Jennie Kim in 2026» no garantiza que la foto sea
 * de Jennie. La ejecucion en seco lo enseño: colaba «渋谷センター街 2026年4月29日
 * の渋谷», una foto de una CALLE de Shibuya, catalogada ahi por una valla
 * publicitaria al fondo; y una nota de prensa de LG sobre telefonos.
 *
 * La regla es sencilla y se puede defender: si ni el titulo ni la descripcion
 * nombran al grupo o a la integrante, NADIE ha dicho que salga en la foto, y
 * una galeria no publica una imagen que no puede identificar. Se pierde alguna
 * foto buena -«Guests at the 2026 Met Gala 127»- y es el precio correcto:
 * equivocarse por publicar de menos se arregla anadiendo, equivocarse por
 * publicar de mas es publicar a otra persona.
 *
 * Los patrones llevan hangul y katakana porque medio Commons cataloga estas
 * fotos en coreano.
 */
const GRUPO = /blackpink|black pink|블랙핑크|ブラックピンク/i;

const NOMBRES = {
  grupo: GRUPO,
  jisoo: /jisoo|ji-?soo|지수|김지수/i,
  jennie: /jennie|제니|김제니/i,
  rose: /ros[eé]|로제|박채영|chae-?young/i,
  lisa: /lisa|리사|라리사|manoba[ln]/i,
};

const LICENCIAS_OK = [
  { patron: /^cc0/, familia: 'CC0', shareAlike: false },
  { patron: /^cc[ -]?by[ -]?sa[ -]?\d/, familia: 'CC BY-SA', shareAlike: true },
  { patron: /^cc[ -]?by[ -]?\d/, familia: 'CC BY', shareAlike: false },
  { patron: /^public domain$/, familia: 'Dominio publico', shareAlike: false },
  { patron: /^pd[- ]/, familia: 'Dominio publico', shareAlike: false },
];

/** Ancho al que se sirven las imagenes de la galeria. */
const ANCHO = 1400;

/**
 * Minimo por el LADO CORTO, no por el ancho.
 *
 * Con un minimo de 800 de ancho se caian 39 fotos utiles -retratos de 719x1007
 * y 775x1064, verticales perfectamente validos en una retícula de albañileria-
 * mientras que pasaban banderolas de 1200x150. El lado corto es lo que dice si
 * una imagen tiene cuerpo suficiente para una galeria; el ancho solo dice si
 * es apaisada.
 */
const LADO_MINIMO = 400;

const args = process.argv.slice(2);
const tiene = (n) => args.includes(`--${n}`);
const valor = (n, def) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? def : args[i + 1];
};

const SECO = !tiene('write') && !tiene('check');

/* ------------------------------------------------------------------ API --- */

async function api(params) {
  const url = new URL(API);
  for (const [k, v] of Object.entries({ ...params, format: 'json', origin: '*' })) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok)
    throw new Error(`Commons ${res.status} en ${params.gcmtitle ?? params.titles ?? ''}`);
  return res.json();
}

/**
 * Espera entre llamadas.
 *
 * Commons corta con «You are making too many requests» y tiene razon: es una
 * API publica sin clave que se sostiene sobre que quien la usa se comporte.
 */
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const PAUSA = 350;

/**
 * Las categorias que empiezan por un prefijo.
 *
 * SE BUSCA POR PREFIJO Y NO POR SUBCATEGORIA, y esto se descubrio midiendo:
 * «Category:Lisa Manoban» y «Category:Lalisa Manobal» EXISTEN, no tienen
 * subcategorias y no contienen un solo archivo. Las fotos estan en «Lisa
 * Manoban in 2016», «... in 2017» y demas, que en Commons son categorias
 * HERMANAS y no hijas. Recorrer el arbol de subcategorias devolvia cero.
 *
 * `allcategories` solo lista categorias que tienen miembros, asi que el
 * prefijo encuentra justo las que valen, incluidas las del ano que viene sin
 * tocar este fichero.
 */
/**
 * ============================================================================
 * COMPROBACION DE IDENTIDAD
 * ============================================================================
 * Antes de traerse una sola foto, se comprueba que cada categoria raiz sea
 * DE VERDAD del grupo, mirando sus categorias padre en Commons.
 *
 * No es celo excesivo: en esta misma API conviven «Category:Jisoo» (BLACKPINK)
 * y «Category:Jisoo (Member of Tahiti)» (otra cantante), y una busqueda por
 * nombre ya colo aqui a «Jennie Kimball», actriz de 1869. Publicar la foto de
 * otra persona bajo el nombre de una integrante no es un fallo de estilo.
 *
 * SE COMPRUEBA EN CADA EJECUCION Y ABORTA SI FALLA. Yo puedo mirarlo una vez;
 * el script tiene que mirarlo siempre, porque las categorias de Commons las
 * renombran personas y el dia que «Category:Jisoo» pase a ser otra cosa, esto
 * se para en vez de descargar.
 */
const PADRES_VALIDOS = /members of blackpink|girl groups from south korea|yg family/i;

async function verificarIdentidad(prefijo) {
  const data = await api({
    action: 'query',
    titles: `Category:${prefijo}`,
    prop: 'categories',
    cllimit: 60,
  });
  await espera(PAUSA);

  const pagina = Object.values(data?.query?.pages ?? {})[0];
  const padres = (pagina?.categories ?? []).map((c) => c.title);
  const ok = padres.some((p) => PADRES_VALIDOS.test(p));

  return {
    ok,
    prueba: padres.find((p) => PADRES_VALIDOS.test(p)) ?? '(ninguna categoria del grupo)',
  };
}

async function categoriasPorPrefijo(prefijo, excluir) {
  const data = await api({
    action: 'query',
    list: 'allcategories',
    acprefix: prefijo,
    aclimit: 200,
  });
  await espera(PAUSA);
  return (
    (data?.query?.allcategories ?? [])
      .map((c) => c['*'])
      /*
       * EL PREFIJO SE ATA. Un prefijo suelto no distingue personas: «Jennie Kim»
       * casaba con «Jennie Kimball», una actriz de 1869, y colo en la seleccion
       * un cromo de tabaco de 1888 a nombre de «Jennie Kemble». Que el nombre
       * empiece igual no significa que sea la misma persona, y una galeria que
       * publica a otra persona bajo el filtro de una integrante no tiene un
       * problema de estilo.
       *
       * Solo entran la categoria raiz y sus derivadas reconocidas: «X in 2019»,
       * «X by year», «X at ...». Cualquier otra continuacion se descarta.
       */
      .filter((nombre) => {
        if (nombre === prefijo) return true;
        const resto = nombre.startsWith(`${prefijo} `) ? nombre.slice(prefijo.length + 1) : null;
        return resto !== null && /^(in \d{4}|by year|at )/i.test(resto);
      })
      .map((nombre) => `Category:${nombre}`)
      .filter((t) => !CATEGORIAS_VETADAS.some((v) => v.test(t)))
      /*
       * El veto por fuente existe porque un prefijo no distingue personas: la
       * categoria «Jisoo» convive con «Jisoo (Member of Tahiti)», que es OTRA
       * cantante. Publicar su foto bajo el filtro de Jisoo seria un error de
       * identidad, no de estilo.
       */
      .filter((t) => !excluir || !excluir.test(t))
  );
}

/**
 * Todos los archivos de una categoria, con sus metadatos.
 *
 * `iiurlwidth` pide a Commons una miniatura al ancho que queremos: se descarga
 * ya reescalada por ellos en vez de traer un original de 8 MB para encogerlo
 * aqui. Es menos ancho de banda para los dos.
 */
async function archivosDeCategoria(category) {
  const salida = [];
  let seguir;

  do {
    const data = await api({
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: category,
      gcmtype: 'file',
      gcmlimit: 100,
      ...(seguir ? { gcmcontinue: seguir } : {}),
      prop: 'imageinfo',
      iiprop: 'url|size|mime|extmetadata',
      iiurlwidth: ANCHO,
      iiextmetadatafilter: [
        'Artist',
        'LicenseShortName',
        'License',
        'LicenseUrl',
        'UsageTerms',
        'DateTimeOriginal',
        'ImageDescription',
        'Credit',
        'AttributionRequired',
        'Restrictions',
      ].join('|'),
    });

    const paginas = data?.query?.pages ?? {};
    for (const pagina of Object.values(paginas)) {
      const info = pagina.imageinfo?.[0];
      if (info) salida.push({ titulo: pagina.title, info });
    }

    seguir = data?.continue?.gcmcontinue;
    await espera(PAUSA);
  } while (seguir);

  return salida;
}

/* -------------------------------------------------------------- filtros --- */

/** Quita el marcado HTML que Commons devuelve dentro de `extmetadata`. */
function aTextoPlano(html) {
  if (!html) return null;
  const texto = String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return texto || null;
}

const meta = (info, clave) => aTextoPlano(info.extmetadata?.[clave]?.value);

/**
 * Decide si una licencia entra.
 *
 * Devuelve la familia y si arrastra ShareAlike, o `null` si no se reconoce.
 * Que no se reconozca NO significa que sea restrictiva: significa que nadie ha
 * comprobado que no lo sea, y eso basta para dejarla fuera.
 */
function clasificarLicencia(nombre) {
  if (!nombre) return null;
  const normal = nombre.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const { patron, familia, shareAlike } of LICENCIAS_OK) {
    if (patron.test(normal)) return { familia, shareAlike, etiqueta: nombre };
  }
  return null;
}

/** Nombre de archivo estable a partir del titulo de Commons. */
function nombreLocal(titulo, mime) {
  // Todo se sirve como JPEG: ver la nota de calidad en commons-download.mjs.
  const ext = 'jpg';
  const base = titulo
    .replace(/^File:/, '')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  // El hash desempata dos titulos que colapsen al mismo texto.
  const hash = createHash('sha256').update(titulo).digest('hex').slice(0, 6);
  return `${base}-${hash}.${ext}`;
}

/* ---------------------------------------------------------------- acopio --- */

async function recolectar() {
  const aceptadas = new Map();
  const rechazos = [];
  let vistos = 0;

  for (const fuente of FUENTES) {
    // Identidad primero. Si esta categoria ya no es del grupo, no se descarga
    // nada de ella: se para el acopio entero y se dice por que.
    const identidad = await verificarIdentidad(fuente.prefijo);
    if (!identidad.ok) {
      throw new Error(
        `«Category:${fuente.prefijo}» no aparece como categoria de BLACKPINK en Commons ` +
          `(padres revisados sin coincidencia). Se aborta antes de descargar nada.`,
      );
    }
    console.error(`  identidad OK  ${fuente.prefijo.padEnd(22)} -> ${identidad.prueba}`);

    let categorias;
    try {
      categorias = await categoriasPorPrefijo(fuente.prefijo, fuente.excluir);
    } catch (error) {
      console.error(`  ! ${fuente.prefijo}: ${error.message}`);
      continue;
    }

    let archivos = [];
    for (const categoria of categorias) {
      try {
        archivos = archivos.concat(await archivosDeCategoria(categoria));
      } catch (error) {
        console.error(`  ! ${categoria}: ${error.message}`);
      }
    }

    console.error(
      `  ${fuente.prefijo.padEnd(24)} ${String(categorias.length).padStart(3)} cat ${String(archivos.length).padStart(5)} archivos`,
    );

    for (const { titulo, info } of archivos) {
      vistos += 1;

      /* Portadas y logotipos fuera, aunque Commons los marque como PD: la
         regla 1 del proyecto no aloja material con copyright, y esta galeria
         es de FOTOGRAFIAS. */
      if (TITULOS_VETADOS.test(titulo)) {
        rechazos.push({ titulo, motivo: 'no es fotografia', detalle: 'portada o logotipo' });
        continue;
      }

      /* Si nadie nombra al grupo ni a la integrante, no se puede afirmar quien
         sale: fuera. Ver la nota de NOMBRES. */
      const textoIdentificador = `${titulo} ${meta(info, 'ImageDescription') ?? ''}`;
      if (!GRUPO.test(textoIdentificador) && !NOMBRES[fuente.subject].test(textoIdentificador)) {
        rechazos.push({
          titulo,
          motivo: 'sin identificar',
          detalle: `no nombra a ${fuente.subject}`,
        });
        continue;
      }

      if (!/^image\/(jpeg|png)$/.test(info.mime ?? '')) {
        rechazos.push({ titulo, motivo: 'formato', detalle: info.mime ?? '?' });
        continue;
      }

      if (DESCRIPCIONES_VETADAS.test(meta(info, 'ImageDescription') ?? '')) {
        rechazos.push({
          titulo,
          motivo: 'no es fotografia',
          detalle: 'captura de video o collage',
        });
        continue;
      }

      const licencia = clasificarLicencia(meta(info, 'LicenseShortName'));
      if (!licencia) {
        rechazos.push({
          titulo,
          motivo: 'licencia',
          detalle: meta(info, 'LicenseShortName') ?? '(sin declarar)',
        });
        continue;
      }

      if (Math.min(info.width ?? 0, info.height ?? 0) < LADO_MINIMO) {
        rechazos.push({ titulo, motivo: 'tamano', detalle: `${info.width}x${info.height}` });
        continue;
      }

      // Una misma foto puede estar en dos categorias; la primera manda y las
      // demas solo suman su tema.
      const yaEsta = aceptadas.get(titulo);
      if (yaEsta) {
        if (!yaEsta.subjects.includes(fuente.subject)) yaEsta.subjects.push(fuente.subject);
        continue;
      }

      const fecha = meta(info, 'DateTimeOriginal');

      aceptadas.set(titulo, {
        id: createHash('sha256').update(titulo).digest('hex').slice(0, 12),
        titulo,
        archivo: nombreLocal(titulo, info.mime),
        subjects: [fuente.subject],
        /*
         * NUNCA SE AMPLIA. `iiurlwidth=1400` le pide a Commons una miniatura
         * de ese ancho, y Commons la da AUNQUE EL ORIGINAL SEA MENOR: un
         * archivo de 599x683 volvia como 1400x1596, que es la misma foto
         * borrosa ocupando cuatro veces mas. Si el original no llega, se sirve
         * el original tal cual.
         *
         * Es el mismo error que evitan las portadas de Spotify midiendo los
         * bytes en vez de creerse la API.
         */
        descargaUrl: info.width > ANCHO ? (info.thumburl ?? info.url) : info.url,
        anchoOrigen: info.width,
        altoOrigen: info.height,
        anchoServido: Math.min(ANCHO, info.width),
        altoServido: Math.round(info.height * (Math.min(ANCHO, info.width) / info.width)),
        autor: meta(info, 'Artist') ?? '(sin autor declarado)',
        licencia: licencia.etiqueta,
        familia: licencia.familia,
        shareAlike: licencia.shareAlike,
        licenciaUrl: meta(info, 'LicenseUrl'),
        origen: info.descriptionurl,
        fecha: fecha ? (fecha.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? fecha.slice(0, 10)) : null,
        anio: Number((fecha ?? '').match(/(19|20)\d{2}/)?.[0]) || null,
        descripcion: meta(info, 'ImageDescription'),
        credito: meta(info, 'Credit'),
        restricciones: meta(info, 'Restrictions'),
      });
    }
  }

  return { aceptadas: [...aceptadas.values()], rechazos, vistos };
}

/* ------------------------------------------------------------ seleccion --- */

/**
 * DE LAS QUE PASAN EL FILTRO, CUALES SE ALOJAN.
 *
 * Commons da cerca de 400 fotos publicables, y alojar 400 archivos de 250 KB
 * son 100 MB en un repositorio git para una galeria que nadie va a recorrer
 * entera. El tope no es una limitacion tecnica: es una decision editorial.
 *
 * SE REPARTE POR ANO, en vueltas. Ordenar por tamano y cortar daria doce fotos
 * del mismo photocall: la mejor camara de un solo dia gana siempre. Cogiendo
 * una de cada ano por vuelta, la galeria recorre la trayectoria del grupo, que
 * es lo unico que hace interesante una galeria de fans, y ademas es lo que da
 * sentido al filtro por era.
 *
 * DENTRO DE CADA ANO MANDA LA DESCRIPCION Y LUEGO EL TAMANO. La descripcion no
 * es un extra: de ella sale el texto alternativo, y una foto sin alt no se
 * puede publicar en un sitio que dice cumplir AA.
 */
function seleccionar(aceptadas, porTema) {
  const porSubject = new Map();
  for (const foto of aceptadas) {
    // Una foto que aparece en dos temas cuenta en el primero: si no, la misma
    // imagen ocuparia dos huecos del tope.
    const tema = foto.subjects[0];
    if (!porSubject.has(tema)) porSubject.set(tema, []);
    porSubject.get(tema).push(foto);
  }

  const elegidas = [];

  for (const [, fotos] of porSubject) {
    const porAnio = new Map();
    for (const foto of fotos) {
      const clave = foto.anio ?? 0;
      if (!porAnio.has(clave)) porAnio.set(clave, []);
      porAnio.get(clave).push(foto);
    }

    for (const lista of porAnio.values()) {
      lista.sort((a, b) => {
        const da = a.descripcion ? 1 : 0;
        const db = b.descripcion ? 1 : 0;
        if (da !== db) return db - da;
        return Math.min(b.anchoOrigen, b.altoOrigen) - Math.min(a.anchoOrigen, a.altoOrigen);
      });
    }

    const anios = [...porAnio.keys()].sort((a, b) => a - b);
    let tomadas = 0;
    let vuelta = 0;

    /*
     * NO SE COGEN DOS FOTOS CON LA MISMA DESCRIPCION.
     *
     * En Commons, una sesion de fotos entra como veinte archivos con el mismo
     * texto de pie -una nota de prensa, casi siempre-. Sin esto, la seleccion
     * traia dos fotos casi identicas del mismo photocall de LG de 2016, con el
     * mismo parrafo de descripcion en las dos. Una galeria con dos fotogramas
     * del mismo segundo no enseña dos cosas: enseña una y ocupa dos huecos.
     */
    const descripcionesUsadas = new Set();

    /*
     * UNA SOLA FOTO POR DIA Y POR TEMA.
     *
     * Sin esto entraban tres fotos del mismo evento de Shopee y dos del mismo
     * concierto de Amsterdam. Y de paso resuelve un caso feo: de las dos fotos
     * de la misma sesion de Marie Claire, una tenia la descripcion VANDALIZADA
     * en Commons -«JennifeAlamat.AnsariKim for Marie nmzmsmudkzuemdk...»-, y de
     * ese texto sale el alt. Quedarse con una por dia deja fuera la mala sin
     * necesidad de detectar vandalismo, que es un problema sin solucion buena.
     */
    const fechasUsadas = new Set();

    while (tomadas < porTema) {
      let algunaEnEstaVuelta = false;
      for (const anio of anios) {
        if (tomadas >= porTema) break;
        const foto = porAnio.get(anio)[vuelta];
        if (!foto) continue;
        algunaEnEstaVuelta = true;

        const huella = (foto.descripcion ?? '').slice(0, 120);
        if (huella && descripcionesUsadas.has(huella)) continue;

        if (foto.fecha && fechasUsadas.has(foto.fecha)) continue;

        descripcionesUsadas.add(huella);
        if (foto.fecha) fechasUsadas.add(foto.fecha);

        elegidas.push(foto);
        tomadas += 1;
      }
      if (!algunaEnEstaVuelta) break;
      vuelta += 1;
    }
  }

  // Orden final por fecha: es como se lee una galeria de trayectoria.
  return elegidas.sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''));
}

/* --------------------------------------------------------------- informe --- */

function informe({ aceptadas, rechazos, vistos }, elegidas, porTema) {
  const porMotivo = {};
  for (const r of rechazos) {
    porMotivo[r.motivo] ??= [];
    porMotivo[r.motivo].push(r);
  }

  console.log('');
  console.log('='.repeat(74));
  console.log('  ACOPIO EN COMMONS');
  console.log('='.repeat(74));
  console.log(`  vistos          ${vistos}`);
  console.log(`  aceptados       ${aceptadas.length}`);
  console.log(`  descartados     ${rechazos.length}`);
  console.log('');

  for (const [motivo, lista] of Object.entries(porMotivo)) {
    const cuenta = {};
    for (const r of lista) cuenta[r.detalle] = (cuenta[r.detalle] ?? 0) + 1;
    console.log(`  DESCARTADOS POR ${motivo.toUpperCase()} (${lista.length})`);
    for (const [detalle, n] of Object.entries(cuenta).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${String(n).padStart(3)}  ${detalle}`);
    }
    console.log('');
  }

  const porFamilia = {};
  const porSubject = {};
  const porAnio = {};
  for (const a of aceptadas) {
    porFamilia[a.familia] = (porFamilia[a.familia] ?? 0) + 1;
    for (const s of a.subjects) porSubject[s] = (porSubject[s] ?? 0) + 1;
    const clave = a.anio ?? 'sin fecha';
    porAnio[clave] = (porAnio[clave] ?? 0) + 1;
  }

  console.log('  ACEPTADAS POR LICENCIA');
  for (const [k, n] of Object.entries(porFamilia).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(3)}  ${k}`);
  }
  console.log('');
  console.log('  POR TEMA (el filtro por integrante sale de aqui)');
  for (const [k, n] of Object.entries(porSubject).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(3)}  ${k}`);
  }
  console.log('');
  console.log('  POR ANO (el filtro por era, si los datos lo soportan)');
  for (const [k, n] of Object.entries(porAnio).sort((a, b) =>
    String(a[0]).localeCompare(String(b[0])),
  )) {
    console.log(`    ${String(n).padStart(3)}  ${k}`);
  }
  console.log('');

  const sinFecha = aceptadas.filter((a) => !a.anio).length;
  const sinDescripcion = aceptadas.filter((a) => !a.descripcion).length;
  const sinAutor = aceptadas.filter((a) => a.autor === '(sin autor declarado)').length;
  console.log('  HUECOS EN LOS METADATOS');
  console.log(`    ${String(sinFecha).padStart(3)}  sin fecha`);
  console.log(`    ${String(sinDescripcion).padStart(3)}  sin descripcion`);
  console.log(`    ${String(sinAutor).padStart(3)}  sin autor declarado`);
  console.log('');

  console.log(`  SELECCIONADAS PARA ALOJAR  (tope ${porTema} por tema)`);
  console.log(`    ${elegidas.length} de ${aceptadas.length} publicables`);
  const selTema = {};
  const selAnio = {};
  for (const e of elegidas) {
    selTema[e.subjects[0]] = (selTema[e.subjects[0]] ?? 0) + 1;
    const k = e.anio ?? 'sin fecha';
    selAnio[k] = (selAnio[k] ?? 0) + 1;
  }
  console.log(
    '    por tema: ' +
      Object.entries(selTema)
        .map(([k, n]) => `${k} ${n}`)
        .join(' · '),
  );
  console.log(
    '    por ano:  ' +
      Object.entries(selAnio)
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
        .map(([k, n]) => `${k} ${n}`)
        .join(' · '),
  );
  const conSA = elegidas.filter((e) => e.shareAlike).length;
  console.log(`    con ShareAlike: ${conSA}`);
  console.log('');

  if (tiene('listar')) {
    console.log('  LAS SELECCIONADAS, UNA A UNA');
    for (const e of elegidas) {
      const sa = e.shareAlike ? ' [SA]' : '';
      console.log(
        `    ${String(e.anio ?? '????')}  ${e.subjects[0].padEnd(6)}  ${e.licencia.padEnd(12)}${sa}  ${e.titulo.replace(/^File:/, '').slice(0, 78)}`,
      );
    }
    console.log('');
  }

  const muestra = elegidas.slice(0, Number(valor('muestra', 3)));
  console.log('  MUESTRA DE METADATOS');
  for (const m of muestra) {
    console.log('  ' + '-'.repeat(70));
    console.log(`  titulo       ${m.titulo}`);
    console.log(`  archivo      ${m.archivo}`);
    console.log(`  temas        ${m.subjects.join(', ')}`);
    console.log(`  autor        ${m.autor}`);
    console.log(
      `  licencia     ${m.licencia}  (${m.familia}${m.shareAlike ? ', ShareAlike' : ''})`,
    );
    console.log(`  licenciaUrl  ${m.licenciaUrl ?? '-'}`);
    console.log(`  origen       ${m.origen}`);
    console.log(`  fecha        ${m.fecha ?? '-'}   ano ${m.anio ?? '-'}`);
    console.log(`  original     ${m.anchoOrigen}x${m.altoOrigen}`);
    console.log(`  servida      ${m.anchoServido ?? '?'}x${m.altoServido ?? '?'}`);
    console.log(`  descripcion  ${(m.descripcion ?? '-').slice(0, 150)}`);
  }
  console.log('');
}

/* -------------------------------------------------------------- ejecucion --- */

async function main() {
  console.error('Consultando Commons...');
  const resultado = await recolectar();

  const porTema = Number(valor('por-tema', 12));
  const elegidas = seleccionar(resultado.aceptadas, porTema);

  informe(resultado, elegidas, porTema);

  if (SECO) {
    console.log('  EJECUCION EN SECO. No se ha descargado ni escrito nada.');
    console.log('  Para descargar y volcar:  node infra/scripts/commons-gallery.mjs --write');
    console.log('');
    return;
  }

  if (tiene('check')) {
    comprobar();
    return;
  }

  // La descarga y el reescalado viven en un modulo aparte para que la
  // ejecucion en seco no necesite `sharp` ni tocar el disco.
  const { descargar } = await import('./lib/commons-download.mjs');
  await descargar(elegidas, { destino: DESTINO, volcado: VOLCADO, ancho: ANCHO });
}

/**
 * EL VOLCADO CONTRA EL DISCO.
 *
 * Mismo papel que `pnpm check:spotify`: el JSON versionado es el registro, y
 * esto avisa si el disco y el registro han dejado de decir lo mismo. Sin esto,
 * borrar un archivo de `public/galeria` no rompe nada visible hasta que
 * alguien abre la galeria en produccion y ve un hueco.
 *
 * NO LLAMA A COMMONS. Comprobar que lo que tenemos es lo que dijimos que
 * teniamos no necesita red, y en CI eso significa que no falla porque
 * Wikimedia tenga un mal dia.
 */
function comprobar() {
  if (!existsSync(VOLCADO)) {
    console.error('No hay volcado. Ejecuta primero --write.');
    process.exitCode = 1;
    return;
  }

  const { fotos } = JSON.parse(readFileSync(VOLCADO, 'utf8'));
  const faltan = [];
  const distintas = [];

  for (const foto of fotos) {
    const ruta = path.join(DESTINO, path.basename(foto.archivo));
    if (!existsSync(ruta)) {
      faltan.push(foto.archivo);
      continue;
    }
    const bytes = readFileSync(ruta).length;
    if (bytes !== foto.bytes) distintas.push(`${foto.archivo}: ${foto.bytes} -> ${bytes}`);
  }

  const enDisco = new Set(readdirSync(DESTINO));
  for (const foto of fotos) enDisco.delete(path.basename(foto.archivo));

  console.log('');
  console.log(`  en el volcado   ${fotos.length}`);
  console.log(`  faltan          ${faltan.length}`);
  console.log(`  cambiadas       ${distintas.length}`);
  console.log(`  sin registrar   ${enDisco.size}`);
  for (const f of faltan.slice(0, 10)) console.log(`    falta      ${f}`);
  for (const d of distintas.slice(0, 10)) console.log(`    cambiada   ${d}`);
  for (const e of [...enDisco].slice(0, 10)) console.log(`    sobra      ${e}`);
  console.log('');

  if (faltan.length || distintas.length || enDisco.size) {
    console.error('  El disco y el volcado no coinciden.');
    process.exitCode = 1;
  } else {
    console.log('  El disco coincide con el volcado.');
  }
}

main().catch((error) => {
  console.error('FALLO:', error.message);
  process.exit(1);
});

export { clasificarLicencia, nombreLocal, aTextoPlano, LICENCIAS_OK, DESTINO, VOLCADO };
