// Descarga las fotos de la galería desde Wikimedia Commons.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..', '..');

const DESTINO = path.join(RAIZ, 'frontend', 'public', 'galeria');
const VOLCADO = path.join(
  RAIZ,
  'backend',
  'content-service',
  'prisma',
  'seed-data',
  'commons-gallery.json',
);

const USER_AGENT =
  'BlackpinkFansite/1.0 (sitio de fans no oficial; https://github.com/JuanK2550) node-fetch';

const API = 'https://commons.wikimedia.org/w/api.php';

const FUENTES = [
  { subject: 'grupo', prefijo: 'Blackpink' },
  { subject: 'jisoo', prefijo: 'Jisoo', excluir: /\(member of tahiti\)/i },
  { subject: 'jennie', prefijo: 'Jennie Kim' },
  { subject: 'rose', prefijo: 'Rosé Park' },
  { subject: 'lisa', prefijo: 'Lisa (Thai vocalist)' },
];

const CATEGORIAS_VETADAS = [/logos?$/i, /album covers/i, /discograph/i];

const TITULOS_VETADOS = /\((ep|single|album|mini album)\)|\b(cover|logo|wordmark|tracklist)\b/i;

const DESCRIPCIONES_VETADAS =
  /captured picture|screenshot|captura de pantalla|youtube\.com|youtu\.be|instagram|collage|montage/i;

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

const ANCHO = 1400;

const LADO_MINIMO = 400;

const args = process.argv.slice(2);
const tiene = (n) => args.includes(`--${n}`);
const valor = (n, def) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? def : args[i + 1];
};

const SECO = !tiene('write') && !tiene('check');

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

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const PAUSA = 350;

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
  return (data?.query?.allcategories ?? [])
    .map((c) => c['*'])
    .filter((nombre) => {
      if (nombre === prefijo) return true;
      const resto = nombre.startsWith(`${prefijo} `) ? nombre.slice(prefijo.length + 1) : null;
      return resto !== null && /^(in \d{4}|by year|at )/i.test(resto);
    })
    .map((nombre) => `Category:${nombre}`)
    .filter((t) => !CATEGORIAS_VETADAS.some((v) => v.test(t)))
    .filter((t) => !excluir || !excluir.test(t));
}

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

function clasificarLicencia(nombre) {
  if (!nombre) return null;
  const normal = nombre.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const { patron, familia, shareAlike } of LICENCIAS_OK) {
    if (patron.test(normal)) return { familia, shareAlike, etiqueta: nombre };
  }
  return null;
}

function nombreLocal(titulo, mime) {
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
  const hash = createHash('sha256').update(titulo).digest('hex').slice(0, 6);
  return `${base}-${hash}.${ext}`;
}

async function recolectar() {
  const aceptadas = new Map();
  const rechazos = [];
  let vistos = 0;

  for (const fuente of FUENTES) {
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

      if (TITULOS_VETADOS.test(titulo)) {
        rechazos.push({ titulo, motivo: 'no es fotografia', detalle: 'portada o logotipo' });
        continue;
      }

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

function seleccionar(aceptadas, porTema) {
  const porSubject = new Map();
  for (const foto of aceptadas) {
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

    const descripcionesUsadas = new Set();

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

  return elegidas.sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''));
}

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

  const { descargar } = await import('./lib/commons-download.mjs');
  await descargar(elegidas, { destino: DESTINO, volcado: VOLCADO, ancho: ANCHO });
}

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
