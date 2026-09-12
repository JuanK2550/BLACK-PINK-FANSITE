#!/usr/bin/env node
// Busca las portadas de los discos en Spotify.

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

const PREFERRED_EDGE = 640;

const THUMB_EDGE = 300;

const BAD_ALBUM_GROUPS = new Set(['compilation', 'appears_on']);

const argv = process.argv.slice(2);
const WRITE = argv.includes('--write');
const ONLY = (argv.find((a) => a.startsWith('--only=')) ?? '').split('=')[1] ?? 'all';
const SET_INDEX = argv.indexOf('--set');
const DUMP = argv.includes('--dump');
const CHECK = argv.includes('--check');

const DUMP_NAME = 'spotify-covers';
const DUMP_NOTE =
  'GENERADO por infra/scripts/spotify-covers.mjs --dump. No editar a mano: ' +
  'es el registro que restaura las portadas tras un db:reset, y manda sobre la base. ' +
  'Congelado a proposito: cambiar una portada debe ser un commit deliberado.';

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‘’`']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
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

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  return 1 - levenshtein(na, nb) / Math.max(na.length, nb.length, 1);
}

function isOurArtist(names, expected) {
  const wanted = normalize(expected);
  return names.some((name) => normalize(name) === wanted);
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
  tokenCache = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return tokenCache.value;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(pathAndQuery) {
  const token = await getToken();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`https://api.spotify.com/v1${pathAndQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 429) {
      const wait = Number(response.headers.get('retry-after') ?? '2');
      process.stderr.write(`  (429: esperando ${wait}s)\n`);
      await sleep((wait + 1) * 1000);
      continue;
    }

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Spotify devolvio HTTP ${response.status}`);

    return response.json();
  }

  throw new Error('Spotify sigue limitando las peticiones tras varios reintentos.');
}

async function getTracks(ids) {
  const out = new Map();

  for (const id of ids) {
    const track = await api(`/tracks/${id}?market=US`);
    if (track) out.set(track.id, track);
    await sleep(120);
  }

  return out;
}

const getAlbum = (id) => api(`/albums/${id}?market=US`);

function pickImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;

  const exact = images.find((image) => image.width === PREFERRED_EDGE);
  if (exact) return exact;

  return [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0] ?? null;
}

async function probeImageSize(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) {
      return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
    }

    if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
      let offset = 2;
      while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = bytes[offset + 1];
        if (
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc
        ) {
          return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
        }
        offset += 2 + bytes.readUInt16BE(offset + 2);
      }
    }

    return null;
  } catch {
    return null;
  }
}

function pickThumb(images, full) {
  if (!Array.isArray(images) || images.length === 0) return null;

  const candidates = images
    .filter((image) => (image.width ?? 0) >= 200 && image.url !== full?.url)
    .sort((a, b) => Math.abs((a.width ?? 0) - THUMB_EDGE) - Math.abs((b.width ?? 0) - THUMB_EDGE));

  return candidates[0] ?? null;
}

function verifyAlbum(album, { title, year, expectedArtist }) {
  const notes = [];
  const artists = (album.artists ?? []).map((a) => a.name);

  const artistOk = isOurArtist(artists, expectedArtist) || isOurArtist(artists, ARTIST);
  if (!artistOk) {
    return { ok: false, fatal: `acreditado a ${artists.join(', ') || '—'}`, notes };
  }

  const group = album.album_group ?? album.album_type ?? '';
  if (BAD_ALBUM_GROUPS.has(group)) {
    return { ok: false, fatal: `es un ${group}, no el lanzamiento original`, notes };
  }

  const spotifyYear = Number(String(album.release_date ?? '').slice(0, 4));
  if (Number.isFinite(spotifyYear) && spotifyYear !== year) {
    const gap = Math.abs(spotifyYear - year);
    if (gap > 1) {
      return {
        ok: false,
        fatal: `Spotify lo fecha en ${spotifyYear} y el catalogo en ${year}`,
        notes,
      };
    }
    notes.push(`ano ${spotifyYear} frente a ${year} (KST: un ano de diferencia es normal)`);
  }

  const titleScore = similarity(album.name, title);
  if (titleScore < 0.75) {
    notes.push(`el titulo difiere: "${album.name}" (${titleScore.toFixed(2)})`);
  }

  return { ok: true, fatal: null, notes, titleScore };
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
  const albums = await prisma.album.findMany({
    where: { coverUrl: { not: null } },
    orderBy: { slug: 'asc' },
  });
  const works = await prisma.soloWork.findMany({
    where: { coverUrl: { not: null } },
    orderBy: { slug: 'asc' },
  });

  const shape = (row) => ({
    coverUrl: row.coverUrl,
    coverWidth: row.coverWidth,
    coverHeight: row.coverHeight,
    coverThumbUrl: row.coverThumbUrl,
    coverThumbWidth: row.coverThumbWidth,
    coverThumbHeight: row.coverThumbHeight,
    coverAlbumId: row.coverAlbumId,
    source: row.coverSource,
  });

  return {
    albums: Object.fromEntries(albums.map((row) => [row.slug, shape(row)])),
    soloWorks: Object.fromEntries(works.map((row) => [row.slug, shape(row)])),
  };
}

async function runDump(prisma) {
  const sections = await collect(prisma);
  const file = writeDump(DUMP_NAME, sections, DUMP_NOTE);
  const total = Object.keys(sections.albums).length + Object.keys(sections.soloWorks).length;
  process.stdout.write(
    `
${paint(C.green, 'OK')} ${total} portadas volcadas a ${path.relative(ROOT, file)}
` +
      `  ${paint(C.dim, 'Versionalo: es lo que devuelve las portadas despues de un db:reset.')}

`,
  );
}

async function runCheck(prisma) {
  const current = await collect(prisma);
  const stored = readDump(DUMP_NAME);

  const ok = reportCheck({
    name: DUMP_NAME,
    script: 'infra/scripts/spotify-covers.mjs',
    dumpExists: stored !== null,
    d: diff(current, stored ?? {}),
    colors: { paint, C },
  });

  if (!ok) process.exitCode = 1;
}

async function main() {
  if (!DATABASE_URL) throw new Error('Falta DATABASE_URL_CONTENT en .env.');

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

    if (ONLY === 'all' || ONLY === 'albums') await processAlbums(prisma, report);
    if (ONLY === 'all' || ONLY === 'solo') await processSoloWorks(prisma, report);

    printReport(report);

    if (WRITE) await runDump(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function processAlbums(prisma, report) {
  const albums = await prisma.album.findMany({
    include: { tracks: { select: { spotifyId: true, title: true } } },
    orderBy: { releaseDate: 'asc' },
  });

  process.stdout.write(`\n${paint(C.bold, `ALBUMES (${albums.length})`)}\n\n`);

  for (const album of albums) {
    const year = album.releaseDate.getUTCFullYear();

    if (album.coverSource === 'MANUAL') {
      report.skipped.push({ key: album.slug, label: album.title, why: 'confirmado a mano' });
      process.stdout.write(
        `  ${paint(C.dim, '·')} ${album.title} ${paint(C.dim, '(manual, intacto)')}\n`,
      );
      continue;
    }

    const trackIds = album.tracks.map((t) => t.spotifyId).filter(Boolean);

    if (trackIds.length === 0) {
      await offerBySearch({ report, album, year, kind: 'album' });
      await sleep(120);
      continue;
    }

    const consensus = await albumFromTracks(trackIds);

    if (!consensus.albumId) {
      report.missed.push({
        key: album.slug,
        label: album.title,
        kind: 'album',
        why: `las pistas no coinciden en un album de Spotify (${consensus.agreement})`,
      });
      process.stdout.write(
        `  ${paint(C.red, '×')} ${album.title} ${paint(C.dim, 'sus pistas apuntan a albumes distintos')}\n`,
      );
      continue;
    }

    await resolveFromAlbumId({
      prisma,
      report,
      kind: 'album',
      id: album.id,
      key: album.slug,
      label: album.title,
      title: album.title,
      year,
      expectedArtist: ARTIST,
      albumId: consensus.albumId,
      agreement: consensus.agreement,
    });

    await sleep(120);
  }
}

async function albumFromTracks(trackIds) {
  const tracks = await getTracks(trackIds);
  const votes = new Map();

  for (const track of tracks.values()) {
    const id = track.album?.id;
    if (!id) continue;
    votes.set(id, (votes.get(id) ?? 0) + 1);
  }

  if (votes.size === 0) return { albumId: null, agreement: '0/0' };

  const [bestId, bestCount] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
  const total = tracks.size;

  if (bestCount * 2 <= total && votes.size > 1) {
    return { albumId: null, agreement: `${bestCount}/${total}` };
  }

  return { albumId: bestId, agreement: `${bestCount}/${total}` };
}

async function processSoloWorks(prisma, report) {
  const works = await prisma.soloWork.findMany({
    include: { member: { select: { stageName: true } } },
    orderBy: { releaseDate: 'asc' },
  });

  process.stdout.write(`\n${paint(C.bold, `OBRAS EN SOLITARIO (${works.length})`)}\n\n`);

  for (const work of works) {
    const year = work.releaseDate.getUTCFullYear();
    const label = `${work.title} · ${work.member.stageName}`;

    if (work.coverSource === 'MANUAL') {
      report.skipped.push({ key: work.slug, label, why: 'confirmado a mano' });
      process.stdout.write(
        `  ${paint(C.dim, '·')} ${label} ${paint(C.dim, '(manual, intacto)')}\n`,
      );
      continue;
    }

    if (!work.spotifyId) {
      report.missed.push({
        key: work.slug,
        label,
        kind: 'solo',
        why: 'no tiene spotifyId: resuelvelo antes con spotify-ids.mjs',
      });
      process.stdout.write(`  ${paint(C.red, '×')} ${label} ${paint(C.dim, 'sin spotifyId')}\n`);
      continue;
    }

    const track = await api(`/tracks/${work.spotifyId}?market=US`);
    const albumId = track?.album?.id;

    if (!albumId) {
      report.missed.push({
        key: work.slug,
        label,
        kind: 'solo',
        why: 'Spotify no reconoce su spotifyId',
      });
      process.stdout.write(`  ${paint(C.red, '×')} ${label} ${paint(C.dim, 'id no reconocido')}\n`);
      continue;
    }

    await resolveFromAlbumId({
      prisma,
      report,
      kind: 'solo',
      id: work.id,
      key: work.slug,
      label,
      title: work.title,
      year,
      expectedArtist: work.member.stageName,
      albumId,
      agreement: '1/1',
      viaTrack: track.name,
    });

    await sleep(120);
  }
}

async function resolveFromAlbumId({
  prisma,
  report,
  kind,
  id,
  key,
  label,
  title,
  year,
  expectedArtist,
  albumId,
  agreement,
  viaTrack,
}) {
  const album = await getAlbum(albumId);

  if (!album) {
    report.missed.push({ key, label, kind, why: 'Spotify no devuelve ese album' });
    process.stdout.write(
      `  ${paint(C.red, '×')} ${label} ${paint(C.dim, 'album no encontrado')}\n`,
    );
    return;
  }

  const check = verifyAlbum(album, { title, year, expectedArtist });
  const image = pickImage(album.images);

  if (!image) {
    report.missed.push({ key, label, kind, why: 'el album no tiene portada en Spotify' });
    process.stdout.write(`  ${paint(C.red, '×')} ${label} ${paint(C.dim, 'sin portada')}\n`);
    return;
  }

  if (!check.ok) {
    report.review.push({
      key,
      label,
      kind,
      note: `identidad -> ${album.name}, pero ${check.fatal}`,
      options: [describeAlbum(album, image)],
    });
    process.stdout.write(`  ${paint(C.yellow, '?')} ${label} ${paint(C.dim, check.fatal)}\n`);
    return;
  }

  const real = await probeImageSize(image.url);
  const width = real?.width ?? image.width;
  const height = real?.height ?? image.height;

  if (real && (real.width !== image.width || real.height !== image.height)) {
    check.notes.push(
      `Spotify declara ${image.width}x${image.height} y sirve ${real.width}x${real.height}: se guarda lo servido`,
    );
  }

  const thumb = pickThumb(album.images, image);
  const thumbReal = thumb ? await probeImageSize(thumb.url) : null;
  const thumbWidth = thumbReal?.width ?? thumb?.width ?? null;
  const thumbHeight = thumbReal?.height ?? thumb?.height ?? null;

  if (
    thumb &&
    thumbReal &&
    (thumbReal.width !== thumb.width || thumbReal.height !== thumb.height)
  ) {
    check.notes.push(
      `miniatura: Spotify declara ${thumb.width}x${thumb.height} y sirve ${thumbReal.width}x${thumbReal.height}`,
    );
  }

  if (WRITE) {
    await writeCover(prisma, kind, id, {
      coverUrl: image.url,
      coverWidth: width,
      coverHeight: height,
      coverThumbUrl: thumb?.url ?? null,
      coverThumbWidth: thumbWidth,
      coverThumbHeight: thumbHeight,
      coverAlbumId: album.id,
      coverSource: 'SCRIPT',
    });
  }

  report.matched.push({
    key,
    label,
    kind,
    albumName: album.name,
    albumId: album.id,
    url: image.url,
    size: `${width}x${height}`,
    thumbUrl: thumb?.url ?? null,
    thumbSize: thumb ? `${thumbWidth}x${thumbHeight}` : null,
    agreement,
    viaTrack,
    notes: check.notes,
    titleScore: check.titleScore,
  });

  const mark = WRITE ? paint(C.green, '✓') : paint(C.green, '≈');
  const via = viaTrack ? `via "${viaTrack}"` : `pistas ${agreement}`;
  process.stdout.write(
    `  ${mark} ${label} ${paint(C.dim, `→ ${album.name} · ${width}px · ${via}`)}\n`,
  );

  for (const note of check.notes) {
    process.stdout.write(`      ${paint(C.yellow, '!')} ${paint(C.dim, note)}\n`);
  }
}

async function offerBySearch({ report, album, year, kind }) {
  const bare = album.title.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const queries = [`album:${album.title} artist:${ARTIST}`];
  if (bare && bare !== album.title) queries.push(`album:${bare} artist:${ARTIST}`);

  const items = [];
  const seen = new Set();

  for (const query of queries) {
    const data = await api(`/search?q=${encodeURIComponent(query)}&type=album&limit=8&market=US`);
    for (const candidate of data?.albums?.items ?? []) {
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      items.push(candidate);
    }
    await sleep(120);
  }

  const options = items
    .map((candidate) => {
      const image = pickImage(candidate.images);
      if (!image) return null;
      const check = verifyAlbum(candidate, {
        title: album.title,
        year,
        expectedArtist: ARTIST,
      });
      return check.ok ? describeAlbum(candidate, image) : null;
    })
    .filter(Boolean)
    .slice(0, 5);

  if (options.length === 0) {
    report.missed.push({
      key: album.slug,
      label: album.title,
      kind,
      why: 'sin pistas identificadas y la busqueda no da nada aceptable',
    });
    process.stdout.write(
      `  ${paint(C.red, '×')} ${album.title} ${paint(C.dim, 'sin pistas y sin candidatas')}\n`,
    );
    return;
  }

  report.review.push({
    key: album.slug,
    label: album.title,
    kind,
    note: 'no tiene pistas con spotifyId: no hay camino de identidad, elige tu',
    options,
  });

  process.stdout.write(
    `  ${paint(C.yellow, '?')} ${album.title} ${paint(C.dim, `${options.length} candidatas — elige`)}\n`,
  );
}

function describeAlbum(album, image) {
  return {
    id: album.id,
    name: album.name,
    artists: (album.artists ?? []).map((a) => a.name).join(', '),
    releaseDate: album.release_date ?? '',
    totalTracks: album.total_tracks ?? 0,
    group: album.album_group ?? album.album_type ?? '',
    url: image.url,
    size: `${image.width}x${image.height}`,
  };
}

async function writeCover(prisma, kind, id, data) {
  if (kind === 'album') {
    await prisma.album.update({ where: { id }, data });
  } else {
    await prisma.soloWork.update({ where: { id }, data });
  }
}

async function applyManual(prisma, args) {
  const [kind, key, albumId] = args;

  if (!kind || !key || !albumId) {
    throw new Error(
      'Uso: --set <album|solo> <slug> <albumId-de-Spotify>\n' +
        '  album: slug del album      ej. blackpink-in-your-area\n' +
        '  solo : slug de la obra     ej. rose-r',
    );
  }

  if (!/^[A-Za-z0-9]{22}$/.test(albumId)) {
    throw new Error(
      `"${albumId}" no tiene forma de identificador de Spotify (22 caracteres alfanumericos).`,
    );
  }

  const album = await getAlbum(albumId);
  if (!album) throw new Error(`Spotify no reconoce el album ${albumId}.`);

  const image = pickImage(album.images);
  if (!image) throw new Error(`El album "${album.name}" no tiene portada en Spotify.`);

  const real = await probeImageSize(image.url);
  const width = real?.width ?? image.width;
  const height = real?.height ?? image.height;

  const thumb = pickThumb(album.images, image);
  const thumbReal = thumb ? await probeImageSize(thumb.url) : null;

  const data = {
    coverUrl: image.url,
    coverWidth: width,
    coverHeight: height,
    coverThumbUrl: thumb?.url ?? null,
    coverThumbWidth: thumbReal?.width ?? thumb?.width ?? null,
    coverThumbHeight: thumbReal?.height ?? thumb?.height ?? null,
    coverAlbumId: album.id,
    coverSource: 'MANUAL',
  };

  if (kind === 'album') {
    const updated = await prisma.album.updateMany({ where: { slug: key }, data });
    if (updated.count === 0) throw new Error(`No existe el album "${key}".`);
  } else if (kind === 'solo') {
    const updated = await prisma.soloWork.updateMany({ where: { slug: key }, data });
    if (updated.count === 0) throw new Error(`No existe la obra "${key}".`);
  } else {
    throw new Error(`Tipo desconocido "${kind}". Usa album o solo.`);
  }

  process.stdout.write(
    `\n${paint(C.green, '✓')} ${key} → ${album.name} (${image.width}x${image.height})\n` +
      `  ${paint(C.dim, image.url)}\n` +
      `  marcado como ${paint(C.bold, 'MANUAL')}: el script no volvera a tocarlo.\n\n`,
  );

  await runDump(prisma);
}

function printReport({ matched, review, missed, skipped }) {
  const line = '─'.repeat(72);
  process.stdout.write(`\n${line}\nINFORME\n${line}\n\n`);

  process.stdout.write(`  Portadas resueltas     ${paint(C.green, String(matched.length))}\n`);
  process.stdout.write(`  Requieren tu decision  ${paint(C.yellow, String(review.length))}\n`);
  process.stdout.write(`  Sin portada            ${paint(C.red, String(missed.length))}\n`);
  if (skipped.length > 0) {
    process.stdout.write(`  Intactas (manual)      ${skipped.length}\n`);
  }

  if (!WRITE && matched.length > 0) {
    process.stdout.write(
      `\n  ${paint(C.dim, 'Simulacion: no se ha escrito nada. Repite con --write.')}\n`,
    );
  }

  if (matched.length > 0) {
    process.stdout.write(`\n${line}\nRESUELTAS (${matched.length})\n${line}\n`);
    process.stdout.write(
      `${paint(C.dim, 'Abre el album y comprueba que la portada es la que esperas.')}\n`,
    );

    for (const entry of matched) {
      const via = entry.viaTrack
        ? `via "${entry.viaTrack}"`
        : `consenso de pistas ${entry.agreement}`;
      process.stdout.write(
        `\n  ${paint(C.bold, entry.label)}  ${paint(C.dim, entry.key)}\n` +
          `    album  ${entry.albumName} ${paint(C.dim, `· ${entry.size} · ${via}`)}\n` +
          `           ${paint(C.dim, `https://open.spotify.com/album/${entry.albumId}`)}\n` +
          `    imagen ${paint(C.dim, entry.url)}\n` +
          (entry.thumbUrl
            ? `    mini   ${paint(C.dim, `${entry.thumbSize} · ${entry.thumbUrl}`)}\n`
            : `    mini   ${paint(C.yellow, 'no hay variante pequena: se usara la grande')}\n`),
      );
      for (const note of entry.notes ?? []) {
        process.stdout.write(`    ${paint(C.yellow, '!')} ${note}\n`);
      }
    }
  }

  if (review.length > 0) {
    process.stdout.write(`\n${line}\nDECIDE TU (${review.length})\n${line}\n`);
    process.stdout.write(
      `${paint(C.dim, 'Ninguna se ha guardado. Copia el comando de la opcion correcta.')}\n`,
    );

    for (const entry of review) {
      process.stdout.write(`\n  ${paint(C.bold, entry.label)}  ${paint(C.dim, entry.key)}\n`);
      if (entry.note) process.stdout.write(`    ${paint(C.dim, entry.note)}\n`);

      for (const option of entry.options) {
        process.stdout.write(
          `    ${option.name} ${paint(C.dim, `· ${option.artists} · ${option.releaseDate} · ${option.totalTracks} pistas · ${option.group} · ${option.size}`)}\n` +
            `        ${paint(C.dim, `https://open.spotify.com/album/${option.id}`)}\n` +
            `        ${paint(C.dim, option.url)}\n` +
            `        node infra/scripts/spotify-covers.mjs --set ${entry.kind} ${entry.key} ${option.id}\n`,
        );
      }
    }
  }

  if (missed.length > 0) {
    process.stdout.write(`\n${line}\nSIN PORTADA (${missed.length})\n${line}\n`);
    for (const entry of missed) {
      process.stdout.write(`  ${entry.label} ${paint(C.dim, `— ${entry.why}`)}\n`);
    }
    process.stdout.write(
      `\n${paint(C.dim, '  Estas se quedan con el marco de relleno: mejor un hueco que otra portada.')}\n`,
    );
  }

  process.stdout.write('\n');
}

main().catch((error) => {
  process.stderr.write(`\n${paint(C.red, 'Error:')} ${error.message}\n\n`);
  process.exitCode = 1;
});
