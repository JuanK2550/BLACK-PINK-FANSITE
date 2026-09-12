#!/usr/bin/env node
// Busca los identificadores de Spotify de cada canción.

import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { PrismaClient } from '../../backend/content-service/prisma/generated/client/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { diff, readDump, reportCheck, writeDump } from './lib/spotify-dump.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ENV_FILE = path.join(ROOT, '.env');
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL_CONTENT;

const ARTIST = 'BLACKPINK';

const ACCEPT = 0.86;
const REVIEW = 0.55;

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const ONLY = (argv.find((a) => a.startsWith('--only=')) ?? '').split('=')[1] ?? 'all';
const SET_INDEX = argv.indexOf('--set');
const DUMP = argv.includes('--dump');
const CHECK = argv.includes('--check');

const DUMP_NAME = 'spotify-ids';
const DUMP_NOTE =
  'GENERADO por infra/scripts/spotify-ids.mjs --dump. No editar a mano: ' +
  'es el registro que restaura los identificadores tras un db:reset, y manda sobre la base. ' +
  'Congelado a proposito: cambiar un identificador debe ser un commit deliberado.';

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const VARIANT_MARKERS =
  /\b(remix|acoustic|instrumental|live|version|ver\.|edit|remaster|sped up|slowed|karaoke|demo|reprise|mix)\b/i;

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;

  const aVariant = VARIANT_MARKERS.test(na);
  const bVariant = VARIANT_MARKERS.test(nb);

  const base = 1 - levenshtein(na, nb) / Math.max(na.length, nb.length, 1);

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

let tokenCache = null;

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

function isOurArtist(candidateArtists, expected) {
  const wanted = normalize(expected);
  return candidateArtists.some((name) => normalize(name) === wanted);
}

function score(candidate, { title, albumTitle }) {
  const artists = candidate.artists.map((a) => a.name);
  if (!isOurArtist(artists, ARTIST)) return { value: 0, reason: 'otro artista' };

  const titleScore = similarity(candidate.name, title);
  const albumScore = albumTitle ? similarity(candidate.album?.name ?? '', albumTitle) : 0;

  const value = Math.min(1, titleScore + (albumScore > 0.8 ? 0.08 : 0));

  return {
    value,
    reason: albumScore > 0.8 ? 'titulo y album' : 'solo titulo',
  };
}

const C = {
  reset: '[0m',
  dim: '[2m',
  green: '[32m',
  yellow: '[33m',
  red: '[31m',
  bold: '[1m',
};

const paint = (color, text) => `${color}${text}${C.reset}`;

async function collect(prisma) {
  const tracks = await prisma.track.findMany({
    where: { spotifyId: { not: null } },
    include: { album: { select: { slug: true } } },
  });
  const works = await prisma.soloWork.findMany({
    where: { spotifyId: { not: null } },
    orderBy: { slug: 'asc' },
  });
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

async function main() {
  if (!DATABASE_URL) {
    throw new Error('Falta DATABASE_URL_CONTENT en .env.');
  }

  const url = new URL(DATABASE_URL);
  const schema = url.searchParams.get('schema') ?? 'public';
  const adapter = new PrismaPg({ connectionString: DATABASE_URL }, { schema });
  const prisma = new PrismaClient({ adapter });

  try {
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

    if (WRITE) await runDump(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function processTracks(prisma, report) {
  const tracks = await prisma.track.findMany({
    include: { album: { select: { slug: true, title: true, releaseDate: true } } },
    orderBy: [{ album: { releaseDate: 'asc' } }, { trackNumber: 'asc' }],
  });

  process.stdout.write(`\n${paint(C.bold, `PISTAS DE ALBUM (${tracks.length})`)}\n\n`);

  for (const track of tracks) {
    const key = `${track.album.slug}#${track.trackNumber}`;
    const label = `${track.title} · ${track.album.title}`;

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

    await sleep(120);
  }
}

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

    let pool = await searchSolo(work.title, work.member.stageName);
    let asRelease = false;

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
    const matches = isOurArtist(artists, soloArtist) || isOurArtist(artists, ARTIST);
    if (!matches) return { value: 0, reason: 'otro artista' };

    return { value: similarity(candidate.name, title), reason: 'titulo' };
  }

  return score(candidate, { title, albumTitle });
}

async function writeId(prisma, kind, id, spotifyId, durationSec) {
  const data = { spotifyId, durationSec, spotifyIdSource: 'SCRIPT' };

  if (kind === 'track') {
    await prisma.track.update({ where: { id }, data });
  } else {
    await prisma.soloWork.update({ where: { id }, data });
  }
}

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
    const work = await prisma.soloWork.findUnique({
      where: { slug: workSlug },
      include: { tracks: true },
    });
    if (!work) throw new Error(`No existe la obra "${workSlug}".`);

    await prisma.soloWork.update({
      where: { id: work.id },
      data: { spotifyId, durationSec, spotifyIdSource: 'MANUAL' },
    });

    // Una obra de UNA sola canción con el mismo título es esa canción: el
    // identificador vale para las dos filas. Con dos o más no se adivina.
    const unica = work.tracks.length === 1 ? work.tracks[0] : null;
    if (unica && unica.title.toLowerCase() === work.title.toLowerCase()) {
      await prisma.soloTrack.update({
        where: { id: unica.id },
        data: { spotifyId, durationSec, spotifyIdSource: 'MANUAL' },
      });
    }
  } else {
    throw new Error(`Tipo desconocido "${kind}". Usa track o solo.`);
  }

  process.stdout.write(
    `\n${paint(C.green, '✓')} ${key} → ${track.name} (${fmt(durationSec)})\n` +
      `  marcado como ${paint(C.bold, 'MANUAL')}: el script no volvera a tocarlo.\n\n`,
  );

  await runDump(prisma);
}

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
