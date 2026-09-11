#!/usr/bin/env node
/**
 * ============================================================================
 * RESOLUCION DE IDENTIFICADORES DE SPOTIFY
 * ============================================================================
 * Busca en la Spotify Web API cada pista del catalogo y cada obra en solitario,
 * y rellena `spotifyId` y `durationSec` cuando la coincidencia es CLARA.
 *
 * La regla que gobierna todo el script:
 *
 *     PREFIERO POCOS DATOS CORRECTOS A MUCHOS INVENTADOS.
 *
 * De ahi las cuatro decisiones que lo definen:
 *
 * 1. NO ESCRIBE NADA por debajo del umbral de confianza. Una coincidencia
 *    floja no se guarda "por si acaso": se deja el campo vacio, que es un
 *    estado honesto y recuperable.
 *
 * 2. LO DUDOSO NO SE DESCARTA EN SILENCIO. Las candidatas se imprimen con su
 *    puntuacion y su URL para que una persona decida. Un descarte silencioso
 *    es indistinguible de un fallo del script.
 *
 * 3. MARCA LA PROCEDENCIA. Todo lo que escribe queda con `spotifyIdSource =
 *    SCRIPT`. Lo confirmado por una persona se marca MANUAL y el script NUNCA
 *    lo pisa, ni con --force.
 *
 * 4. NO TOCA `verified`. Que Spotify tenga una cancion no valida el resto de
 *    la ficha; son dos afirmaciones distintas y este script solo puede
 *    responder por una.
 *
 * USO
 *   node infra/scripts/spotify-ids.mjs                  informe, sin escribir
 *   node infra/scripts/spotify-ids.mjs --write          escribe las claras
 *   node infra/scripts/spotify-ids.mjs --write --only=tracks
 *   node infra/scripts/spotify-ids.mjs --set <tipo> <clave> <spotifyId>
 *   node infra/scripts/spotify-ids.mjs --dump           vuelca la base al fichero
 *   node infra/scripts/spotify-ids.mjs --check          base contra volcado (CI)
 *
 * El ultimo modo es el que cierra el circulo: resuelve a mano una candidata
 * dudosa y la marca como MANUAL.
 *
 *   node infra/scripts/spotify-ids.mjs --set track born-pink#3 3Xt8OuIT2p8T1PSrQBRq3s
 *   node infra/scripts/spotify-ids.mjs --set solo rose/rose-apt 5vNRhkKd0yEAg8suGBpjeY
 * ============================================================================
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { PrismaClient } from '../../services/content-service/prisma/generated/client/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { diff, readDump, reportCheck, writeDump } from './lib/spotify-dump.mjs';

/* -------------------------------------------------------------- entorno --- */

const ROOT = path.resolve(import.meta.dirname, '../..');
const ENV_FILE = path.join(ROOT, '.env');
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL_CONTENT;

/** El artista canonico. Toda busqueda se ancla aqui. */
const ARTIST = 'BLACKPINK';

/**
 * Umbrales de decision.
 *
 * `ACCEPT` en 0.86 no es un numero redondo por casualidad: por debajo empiezan
 * a aparecer versiones en directo y remezclas con el titulo casi identico, y
 * ese es exactamente el error que este script no puede permitirse.
 */
const ACCEPT = 0.86;
const REVIEW = 0.55;

/* ------------------------------------------------------------ argumentos --- */

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const ONLY = (argv.find((a) => a.startsWith('--only=')) ?? '').split('=')[1] ?? 'all';
const SET_INDEX = argv.indexOf('--set');
const DUMP = argv.includes('--dump');
const CHECK = argv.includes('--check');

/**
 * Volcado de este script. Un fichero por script.
 *
 * Existe porque la base se borra -`pnpm db:reset`- y el seed no sabe nada de
 * identificadores. Sin el, cada reinicio pierde 39 filas, y las MANUAL no
 * vuelven solas: al quedar el campo vacio el script deja de ver la marca y
 * vuelve a resolver por puntuacion, que es lo que esa marca existe para
 * impedir. Ver `lib/spotify-dump.mjs`.
 */
const DUMP_NAME = 'spotify-ids';
const DUMP_NOTE =
  'GENERADO por infra/scripts/spotify-ids.mjs --dump. No editar a mano: ' +
  'es el registro que restaura los identificadores tras un db:reset, y manda sobre la base. ' +
  'Congelado a proposito: cambiar un identificador debe ser un commit deliberado.';

/* ------------------------------------------------------ texto y similitud --- */

/**
 * Normaliza un titulo para comparar.
 *
 * Quita acentos, pasa a minusculas y elimina la puntuacion, pero NO toca los
 * parentesis todavia: "Whistle (Acoustic Ver.)" y "Whistle" tienen que poder
 * distinguirse, y ahi esta justo la diferencia entre acertar y guardar la
 * version equivocada.
 */
function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Marcas que cambian lo que una cancion ES, no como se llama. */
const VARIANT_MARKERS =
  /\b(remix|acoustic|instrumental|live|version|ver\.|edit|remaster|sped up|slowed|karaoke|demo|reprise|mix)\b/i;

/**
 * Similitud entre dos titulos, de 0 a 1.
 *
 * Se combina la distancia de edicion con una comprobacion de VARIANTE: si uno
 * de los dos titulos dice "remix" o "live" y el otro no, la puntuacion se
 * hunde aunque el texto se parezca al 95%. Sin esta regla, "DDU-DU DDU-DU" y
 * "DDU-DU DDU-DU (Remix)" salen casi identicos y el script guardaria la
 * remezcla como si fuera el original.
 */
function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;

  const aVariant = VARIANT_MARKERS.test(na);
  const bVariant = VARIANT_MARKERS.test(nb);

  const base = 1 - levenshtein(na, nb) / Math.max(na.length, nb.length, 1);

  // Uno es variante y el otro no: son canciones distintas.
  if (aVariant !== bVariant) return base * 0.45;

  return base;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = row;
  }

  return prev[b.length];
}

/* ------------------------------------------------------------- Spotify --- */

let tokenCache = null;

/**
 * Token de Client Credentials.
 *
 * Este flujo NO da acceso a datos de ningun usuario: solo al catalogo publico.
 * Es exactamente lo que hace falta aqui y nada mas.
 */
async function getToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value;

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    // El cuerpo del error puede repetir el client_id; no se imprime.
    throw new Error(
      `Spotify rechazo las credenciales (HTTP ${response.status}). ` +
        'Revisa SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en .env.',
    );
  }

  const data = await response.json();
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return tokenCache.value;
}

/**
 * Busca en el catalogo, reintentando cuando Spotify pide esperar.
 *
 * Spotify responde 429 con `Retry-After` en segundos. Ignorarlo y reintentar
 * en bucle es la forma mas rapida de que corten la aplicacion entera, asi que
 * se respeta el valor que envian.
 */
async function search(query, limit = 8) {
  const token = await getToken();
  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'track');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('market', 'US');

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (response.status === 429) {
      const wait = Number(response.headers.get('retry-after') ?? '2');
      process.stderr.write(`  (429: esperando ${wait}s)\n`);
      await sleep((wait + 1) * 1000);
      continue;
    }

    if (!response.ok) throw new Error(`Spotify devolvio HTTP ${response.status}`);

    const data = await response.json();
    return data.tracks?.items ?? [];
  }

  throw new Error('Spotify sigue limitando las peticiones tras varios reintentos.');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------ evaluacion --- */

/**
 * ¿Es este artista uno de los nuestros?
 *
 * OJO: esto se comparaba antes con `includes()`, y por ahi se colo un error
 * real. `normalize('ROSE')` es `rose`, y `'rosevelt sings'.includes('rose')`
 * es cierto, asi que el script guardo en la ficha del album "rosie" una
 * cancion de Rosevelt Sings y Dick Van Dyke con puntuacion 1.00. La
 * comprobacion que debia ser eliminatoria era justo la que dejaba pasar el
 * error mas grave que este script puede cometer.
 *
 * Ahora se compara el nombre COMPLETO del artista, no un trozo. Se admite el
 * nombre exacto y las formas con las que Spotify acredita colaboraciones
 * ("ROSE, Bruno Mars" llega como dos artistas separados, asi que basta con
 * que uno cualquiera sea el nuestro).
 */
function isOurArtist(candidateArtists, expected) {
  const wanted = normalize(expected);
  return candidateArtists.some((name) => normalize(name) === wanted);
}

/**
 * Puntua una candidata contra lo que buscamos.
 *
 * El titulo pesa lo que mas, pero el ARTISTA es eliminatorio: una version de
 * otro artista con el mismo titulo puntuaria alto por texto y seria un error
 * grave. Coincidir de album sube la confianza; no coincidir no la baja, porque
 * la misma cancion aparece en recopilatorios y ediciones distintas.
 */
function score(candidate, { title, albumTitle }) {
  const artists = candidate.artists.map((a) => a.name);
  if (!isOurArtist(artists, ARTIST)) return { value: 0, reason: 'otro artista' };

  const titleScore = similarity(candidate.name, title);
  const albumScore = albumTitle ? similarity(candidate.album?.name ?? '', albumTitle) : 0;

  // El album solo suma; nunca resta.
  const value = Math.min(1, titleScore + (albumScore > 0.8 ? 0.08 : 0));

  return {
    value,
    reason: albumScore > 0.8 ? 'titulo y album' : 'solo titulo',
  };
}

/* --------------------------------------------------------------- salida --- */

const C = {
  reset: '[0m',
  dim: '[2m',
  green: '[32m',
  yellow: '[33m',
  red: '[31m',
  bold: '[1m',
};

const paint = (color, text) => `${color}${text}${C.reset}`;

/* ------------------------------------------------------------- volcado --- */

/**
 * Lo que hay HOY en la base, en la forma exacta del volcado.
 *
 * Las claves son las mismas que acepta `--set`: `born-pink#3` para una pista y
 * `rose-r` para una obra en solitario. Asi, la entrada que cambia en el diff se
 * llama igual que el comando que la escribio.
 *
 * `source` viaja SIEMPRE. Restaurar el identificador sin la marca dejaria las
 * tres decisiones MANUAL indistinguibles de las automaticas, y el script
 * volveria a pisarlas en la siguiente pasada.
 */
async function collect(prisma) {
  const tracks = await prisma.track.findMany({
    where: { spotifyId: { not: null } },
    include: { album: { select: { slug: true } } },
  });
  const works = await prisma.soloWork.findMany({
    where: { spotifyId: { not: null } },
    orderBy: { slug: 'asc' },
  });
  // Las canciones de las obras en solitario (Fase 14). Si esta seccion no se
  // recogiera aqui, `--check` veria cada entrada del volcado como «sobra» y
  // `--dump` las borraria del fichero en la siguiente pasada.
  const soloTracks = await prisma.soloTrack.findMany({
    where: { spotifyId: { not: null } },
    include: { soloWork: { select: { slug: true } } },
  });

  const shape = (row) => ({
    spotifyId: row.spotifyId,
    durationSec: row.durationSec,
    source: row.spotifyIdSource,
  });

  return {
    tracks: Object.fromEntries(
      tracks.map((row) => [`${row.album.slug}#${row.trackNumber}`, shape(row)]),
    ),
    soloWorks: Object.fromEntries(works.map((row) => [row.slug, shape(row)])),
    soloTracks: Object.fromEntries(
      soloTracks.map((row) => [`${row.soloWork.slug}#${row.trackNumber}`, shape(row)]),
    ),
  };
}

async function runDump(prisma) {
  const sections = await collect(prisma);
  const file = writeDump(DUMP_NAME, sections, DUMP_NOTE);
  const total =
    Object.keys(sections.tracks).length +
    Object.keys(sections.soloWorks).length +
    Object.keys(sections.soloTracks).length;
  process.stdout.write(
    `
${paint(C.green, 'OK')} ${total} identificadores volcados a ${path.relative(ROOT, file)}
` +
      `  ${paint(C.dim, 'Versionalo: es lo que los devuelve despues de un db:reset.')}

`,
  );
}

async function runCheck(prisma) {
  const current = await collect(prisma);
  const stored = readDump(DUMP_NAME);

  const ok = reportCheck({
    name: DUMP_NAME,
    script: 'infra/scripts/spotify-ids.mjs',
    dumpExists: stored !== null,
    d: diff(current, stored ?? {}),
    colors: { paint, C },
  });

  if (!ok) process.exitCode = 1;
}

/* ----------------------------------------------------------------- main --- */

async function main() {
  if (!DATABASE_URL) {
    throw new Error('Falta DATABASE_URL_CONTENT en .env.');
  }

  const url = new URL(DATABASE_URL);
  const schema = url.searchParams.get('schema') ?? 'public';
  const adapter = new PrismaPg({ connectionString: DATABASE_URL }, { schema });
  const prisma = new PrismaClient({ adapter });

  try {
    /*
     * `--dump` y `--check` NO hablan con Spotify: solo leen la base y el
     * fichero. Por eso van antes de exigir credenciales -CI no las tiene y
     * tampoco las necesita-.
     */
    if (DUMP) {
      await runDump(prisma);
      return;
    }

    if (CHECK) {
      await runCheck(prisma);
      return;
    }

    if (SET_INDEX !== -1) {
      await applyManual(prisma, argv.slice(SET_INDEX + 1));
      return;
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error(
        'Faltan SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET en .env.\n' +
          'Como obtenerlas: README.md, seccion "Identificadores de Spotify".',
      );
    }

    const report = { matched: [], review: [], missed: [], skipped: [] };

    if (ONLY === 'all' || ONLY === 'tracks') await processTracks(prisma, report);
    if (ONLY === 'all' || ONLY === 'solo') await processSoloWorks(prisma, report);

    printReport(report);

    /*
     * Volcar es parte de escribir, no un paso que recordar. Si fuera opcional
     * existiria el estado "la base tiene un identificador que el volcado no", y
     * ese estado se descubre en el proximo db:reset, cuando ya se perdio.
     */
    if (WRITE) await runDump(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

/* ------------------------------------------------------- pistas de album --- */

async function processTracks(prisma, report) {
  const tracks = await prisma.track.findMany({
    include: { album: { select: { slug: true, title: true, releaseDate: true } } },
    orderBy: [{ album: { releaseDate: 'asc' } }, { trackNumber: 'asc' }],
  });

  process.stdout.write(`\n${paint(C.bold, `PISTAS DE ALBUM (${tracks.length})`)}\n\n`);

  for (const track of tracks) {
    const key = `${track.album.slug}#${track.trackNumber}`;
    const label = `${track.title} · ${track.album.title}`;

    // Lo confirmado a mano es intocable: una persona ya decidio.
    if (track.spotifyIdSource === 'MANUAL') {
      report.skipped.push({ key, label, why: 'confirmado a mano' });
      process.stdout.write(
        `  ${paint(C.dim, '·')} ${label} ${paint(C.dim, '(manual, intacto)')}\n`,
      );
      continue;
    }

    const candidates = await search(
      `track:${track.title} artist:${ARTIST} album:${track.album.title}`,
    );

    // Si la busqueda acotada no da nada, se afloja quitando el album: hay
    // canciones que en Spotify viven en un album con otro nombre.
    const pool =
      candidates.length > 0 ? candidates : await search(`track:${track.title} artist:${ARTIST}`);

    await evaluate({
      prisma,
      report,
      pool,
      key,
      label,
      kind: 'track',
      id: track.id,
      title: track.title,
      albumTitle: track.album.title,
    });

    // Ritmo deliberado: la API tolera mas, pero no hay ninguna prisa y esto
    // evita el 429 por completo en un catalogo de este tamano.
    await sleep(120);
  }
}

/* --------------------------------------------------- obras en solitario --- */

async function processSoloWorks(prisma, report) {
  const works = await prisma.soloWork.findMany({
    include: { member: { select: { slug: true, stageName: true } } },
    orderBy: { releaseDate: 'asc' },
  });

  process.stdout.write(`\n${paint(C.bold, `OBRAS EN SOLITARIO (${works.length})`)}\n\n`);

  for (const work of works) {
    const key = `${work.member.slug}/${work.slug}`;
    const label = `${work.title} · ${work.member.stageName}`;

    if (work.spotifyIdSource === 'MANUAL') {
      report.skipped.push({ key, label, why: 'confirmado a mano' });
      process.stdout.write(
        `  ${paint(C.dim, '·')} ${label} ${paint(C.dim, '(manual, intacto)')}\n`,
      );
      continue;
    }

    /*
     * El artista aqui es la INTEGRANTE, no el grupo. Buscar "SOLO" con
     * artist:BLACKPINK no encuentra el single de JENNIE, porque en Spotify
     * figura a su nombre. Se prueban las dos.
     */
    let pool = await searchSolo(work.title, work.member.stageName);
    let asRelease = false;

    /*
     * Si no hay ninguna pista que se parezca, puede que no sea una cancion
     * sino un lanzamiento entero. Se busca como album y se ofrecen sus pistas
     * como candidatas: el visitante final necesita una CANCION concreta para
     * el reproductor, y esa eleccion la tiene que hacer una persona.
     */
    /*
     * Se puntua con `scoreFor`, NO con `similarity` a secas. La diferencia
     * importa: `similarity` solo compara titulos, asi que una cancion ajena
     * llamada igual que el lanzamiento -hay una "Rosie" de Rosevelt Sings-
     * puntuaba 1.00 aqui y desactivaba el rescate por album. El resultado era
     * un "sin coincidencia" donde en realidad si habia algo que ofrecer.
     * `scoreFor` descarta al artista ajeno antes de puntuar.
     */
    const bestSoFar = pool.length
      ? Math.max(
          ...pool.map(
            (c) =>
              scoreFor(c, {
                title: work.title,
                albumTitle: null,
                soloArtist: work.member.stageName,
              }).value,
          ),
        )
      : 0;

    if (bestSoFar < ACCEPT) {
      const fromRelease = await searchRelease(work.title, work.member.stageName);
      if (fromRelease.length > 0) {
        pool = fromRelease;
        asRelease = true;
      }
    }

    await evaluate({
      prisma,
      report,
      pool,
      key,
      label,
      kind: 'solo',
      id: work.id,
      title: work.title,
      albumTitle: null,
      soloArtist: work.member.stageName,
      asRelease,
    });

    await sleep(120);
  }
}

/**
 * Busca un LANZAMIENTO (album, EP o single album) y devuelve sus pistas.
 *
 * Existe porque parte del catalogo en solitario no son canciones sueltas: "R"
 * es el EP de debut de ROSE y "ME" el single album de JISOO. No hay ninguna
 * cancion que se llame asi, de modo que buscar una pista con ese titulo no
 * falla por un problema de puntuacion: falla porque no existe.
 *
 * Sin esto, el informe decia "sin coincidencia" y no daba con que decidir. Con
 * esto, ofrece las canciones REALES de ese lanzamiento para que una persona
 * elija cual representa la obra.
 */
async function searchRelease(title, artistName) {
  const token = await getToken();

  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', `album:${title} artist:${artistName}`);
  url.searchParams.set('type', 'album');
  url.searchParams.set('limit', '3');
  url.searchParams.set('market', 'US');

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return [];

  const data = await response.json();
  const albums = data.albums?.items ?? [];

  // Solo lanzamientos cuyo nombre se parezca de verdad al que buscamos: una
  // busqueda floja devuelve recopilatorios de otra gente.
  const match = albums.find((album) => similarity(album.name, title) > 0.7);
  if (!match) return [];

  const tracksResponse = await fetch(
    `https://api.spotify.com/v1/albums/${match.id}/tracks?market=US&limit=20`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!tracksResponse.ok) return [];

  const tracksData = await tracksResponse.json();
  return (tracksData.items ?? []).map((track) => ({
    ...track,
    album: { name: match.name },
  }));
}

async function searchSolo(title, stageName) {
  const byMember = await search(`track:${title} artist:${stageName}`);
  if (byMember.length > 0) return byMember;
  return search(`track:${title} artist:${ARTIST}`);
}

/* ------------------------------------------------------------ evaluacion --- */

async function evaluate({
  prisma,
  report,
  pool,
  key,
  label,
  kind,
  id,
  title,
  albumTitle,
  soloArtist,
  asRelease = false,
}) {
  if (pool.length === 0) {
    report.missed.push({ key, label, kind, why: 'sin resultados' });
    process.stdout.write(`  ${paint(C.red, '×')} ${label} ${paint(C.dim, 'sin resultados')}\n`);
    return;
  }

  const scored = pool
    .map((candidate) => ({
      candidate,
      ...scoreFor(candidate, { title, albumTitle, soloArtist }),
    }))
    .sort((a, b) => b.value - a.value);

  const best = scored[0];

  /*
   * Candidatas sacadas de un lanzamiento: se mandan SIEMPRE a decision humana.
   * Aqui el titulo de la obra ("R") no coincide con el de ninguna pista por
   * definicion, asi que la puntuacion no significa nada y aceptar la mejor
   * seria elegir al azar.
   */
  if (asRelease) {
    report.review.push({
      key,
      label,
      kind,
      note: 'es un lanzamiento, no una cancion: elige que pista lo representa',
      options: scored.slice(0, 5).map((entry) => ({
        id: entry.candidate.id,
        name: entry.candidate.name,
        album: entry.candidate.album?.name ?? '',
        artists: entry.candidate.artists.map((a) => a.name).join(', '),
        durationSec: Math.round(entry.candidate.duration_ms / 1000),
        value: entry.value,
      })),
    });

    process.stdout.write(
      `  ${paint(C.yellow, '?')} ${label} ${paint(C.dim, 'es un lanzamiento — elige pista')}\n`,
    );
    return;
  }

  if (best.value >= ACCEPT) {
    const spotifyId = best.candidate.id;
    const durationSec = Math.round(best.candidate.duration_ms / 1000);

    if (WRITE) {
      await writeId(prisma, kind, id, spotifyId, durationSec);
    }

    report.matched.push({
      key,
      label,
      spotifyId,
      durationSec,
      value: best.value,
      spotifyTitle: best.candidate.name,
    });

    const mark = WRITE ? paint(C.green, '✓') : paint(C.green, '≈');
    process.stdout.write(
      `  ${mark} ${label} ${paint(C.dim, `→ ${best.candidate.name} · ${fmt(durationSec)} · ${best.value.toFixed(2)}`)}\n`,
    );
    return;
  }

  if (best.value >= REVIEW) {
    // DUDOSA: no se escribe, pero tampoco se tira. Se enseñan las candidatas.
    report.review.push({
      key,
      label,
      kind,
      options: scored.slice(0, 3).map((entry) => ({
        id: entry.candidate.id,
        name: entry.candidate.name,
        album: entry.candidate.album?.name ?? '',
        artists: entry.candidate.artists.map((a) => a.name).join(', '),
        durationSec: Math.round(entry.candidate.duration_ms / 1000),
        value: entry.value,
      })),
    });

    process.stdout.write(
      `  ${paint(C.yellow, '?')} ${label} ${paint(C.dim, `mejor ${best.value.toFixed(2)} — requiere decision`)}\n`,
    );
    return;
  }

  report.missed.push({ key, label, kind, why: `nada por encima de ${REVIEW}` });
  process.stdout.write(
    `  ${paint(C.red, '×')} ${label} ${paint(C.dim, `mejor ${best.value.toFixed(2)}`)}\n`,
  );
}

function scoreFor(candidate, { title, albumTitle, soloArtist }) {
  if (soloArtist) {
    const artists = candidate.artists.map((a) => a.name);
    // La integrante o el grupo: una obra en solitario puede venir acreditada
    // a cualquiera de los dos segun como la publicara el sello.
    const matches = isOurArtist(artists, soloArtist) || isOurArtist(artists, ARTIST);
    if (!matches) return { value: 0, reason: 'otro artista' };

    return { value: similarity(candidate.name, title), reason: 'titulo' };
  }

  return score(candidate, { title, albumTitle });
}

/* -------------------------------------------------------------- escritura --- */

async function writeId(prisma, kind, id, spotifyId, durationSec) {
  const data = { spotifyId, durationSec, spotifyIdSource: 'SCRIPT' };

  if (kind === 'track') {
    await prisma.track.update({ where: { id }, data });
  } else {
    await prisma.soloWork.update({ where: { id }, data });
  }
}

/* ------------------------------------------------------ confirmar a mano --- */

/**
 * `--set <tipo> <clave> <spotifyId>`
 *
 * Resuelve una candidata dudosa. Queda marcada MANUAL, y a partir de ahi el
 * script no vuelve a tocarla nunca.
 */
async function applyManual(prisma, args) {
  const [kind, key, spotifyId] = args;

  if (!kind || !key || !spotifyId) {
    throw new Error(
      'Uso: --set <track|solo> <clave> <spotifyId>\n' +
        '  track: album-slug#numero      ej. born-pink#3\n' +
        '  solo : member-slug/work-slug  ej. rose/rose-apt',
    );
  }

  if (!/^[A-Za-z0-9]{22}$/.test(spotifyId)) {
    throw new Error(
      `"${spotifyId}" no tiene forma de identificador de Spotify (22 caracteres alfanumericos).`,
    );
  }

  // Se consulta la pista para guardar la duracion REAL y, de paso, comprobar
  // que el identificador existe: un id mal copiado se detecta aqui y no dentro
  // de seis meses con un reproductor vacio.
  const token = await getToken();
  const response = await fetch(`https://api.spotify.com/v1/tracks/${spotifyId}?market=US`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Spotify no reconoce el identificador ${spotifyId} (HTTP ${response.status}).`);
  }

  const track = await response.json();
  const durationSec = Math.round(track.duration_ms / 1000);

  if (kind === 'track') {
    const [albumSlug, numberRaw] = key.split('#');
    const album = await prisma.album.findUnique({ where: { slug: albumSlug } });
    if (!album) throw new Error(`No existe el album "${albumSlug}".`);

    const updated = await prisma.track.updateMany({
      where: { albumId: album.id, trackNumber: Number(numberRaw) },
      data: { spotifyId, durationSec, spotifyIdSource: 'MANUAL' },
    });
    if (updated.count === 0) throw new Error(`No existe la pista ${key}.`);
  } else if (kind === 'solo') {
    const [, workSlug] = key.split('/');
    const updated = await prisma.soloWork.updateMany({
      where: { slug: workSlug },
      data: { spotifyId, durationSec, spotifyIdSource: 'MANUAL' },
    });
    if (updated.count === 0) throw new Error(`No existe la obra "${workSlug}".`);
  } else {
    throw new Error(`Tipo desconocido "${kind}". Usa track o solo.`);
  }

  process.stdout.write(
    `\n${paint(C.green, '✓')} ${key} → ${track.name} (${fmt(durationSec)})\n` +
      `  marcado como ${paint(C.bold, 'MANUAL')}: el script no volvera a tocarlo.\n\n`,
  );

  // Una decision manual es justo lo que NO se puede regenerar: si se pierde,
  // hay que volver a tomarla. Volcarla en el acto es lo que la salva del
  // proximo reinicio.
  await runDump(prisma);
}

/* --------------------------------------------------------------- informe --- */

function fmt(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function printReport({ matched, review, missed, skipped }) {
  const line = '─'.repeat(72);
  process.stdout.write(`\n${line}\nINFORME\n${line}\n\n`);

  process.stdout.write(`  Coincidencias claras   ${paint(C.green, String(matched.length))}\n`);
  process.stdout.write(`  Requieren tu decision  ${paint(C.yellow, String(review.length))}\n`);
  process.stdout.write(`  Sin coincidencia       ${paint(C.red, String(missed.length))}\n`);
  if (skipped.length > 0) {
    process.stdout.write(`  Intactas (manual)      ${skipped.length}\n`);
  }

  if (!WRITE && matched.length > 0) {
    process.stdout.write(
      `\n  ${paint(C.dim, 'Simulacion: no se ha escrito nada. Repite con --write.')}\n`,
    );
  }

  if (review.length > 0) {
    process.stdout.write(`\n${line}\nDECIDE TU (${review.length})\n${line}\n`);
    process.stdout.write(
      `${paint(C.dim, 'Ninguna se ha guardado. Copia el comando de la opcion correcta.')}\n`,
    );

    for (const entry of review) {
      process.stdout.write(`\n  ${paint(C.bold, entry.label)}  ${paint(C.dim, entry.key)}\n`);
      if (entry.note) {
        process.stdout.write(`    ${paint(C.dim, entry.note)}\n`);
      }

      for (const option of entry.options) {
        process.stdout.write(
          `    ${option.value.toFixed(2)}  ${option.name} ${paint(C.dim, `· ${option.artists} · ${option.album} · ${fmt(option.durationSec)}`)}\n` +
            `          ${paint(C.dim, `https://open.spotify.com/track/${option.id}`)}\n` +
            `          node infra/scripts/spotify-ids.mjs --set ${entry.kind} ${entry.key} ${option.id}\n`,
        );
      }
    }
  }

  if (missed.length > 0) {
    process.stdout.write(`\n${line}\nSIN COINCIDENCIA (${missed.length})\n${line}\n`);
    for (const entry of missed) {
      process.stdout.write(`  ${entry.label} ${paint(C.dim, `— ${entry.why}`)}\n`);
    }
    process.stdout.write(
      `\n${paint(C.dim, '  Estas se quedan vacias a proposito: mejor un hueco que un dato equivocado.')}\n`,
    );
  }

  process.stdout.write('\n');
}

main().catch((error) => {
  process.stderr.write(`\n${paint(C.red, 'Error:')} ${error.message}\n\n`);
  process.exitCode = 1;
});
