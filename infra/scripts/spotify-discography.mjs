// Lista lo publicado en Spotify y lo compara con el catálogo (no escribe).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function cargarEnv() {
  const env = {};
  for (const linea of readFileSync(path.join(RAIZ, '.env'), 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const ENV = cargarEnv();
const CONTENT = process.env.CONTENT_URL ?? 'http://localhost:4001/api/v1';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

let token = null;

async function getToken() {
  const credenciales = Buffer.from(
    `${ENV.SPOTIFY_CLIENT_ID}:${ENV.SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credenciales}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`token de Spotify: ${res.status}`);
  return (await res.json()).access_token;
}

async function api(ruta) {
  token ??= await getToken();
  for (let intento = 0; intento < 4; intento += 1) {
    const res = await fetch(`https://api.spotify.com/v1${ruta}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 429) {
      await espera(Math.min(Number(res.headers.get('retry-after') ?? 2), 10) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`Spotify ${res.status} en ${ruta}`);
    await espera(120);
    return res.json();
  }
  throw new Error(`Spotify sigue limitando en ${ruta}`);
}

async function catalogo() {
  const albums = (await fetch(`${CONTENT}/albums?locale=es&limit=100`).then((r) => r.json())).data;
  const detalle = [];
  for (const a of albums) {
    detalle.push((await fetch(`${CONTENT}/albums/${a.slug}?locale=es`).then((r) => r.json())).data);
  }
  const miembros = {};
  for (const slug of ['jisoo', 'jennie', 'rose', 'lisa']) {
    miembros[slug] = (
      await fetch(`${CONTENT}/members/${slug}?locale=es`).then((r) => r.json())
    ).data;
  }
  return { albums: detalle, miembros };
}

async function artistaDesde(trackId) {
  const t = await api(`/tracks/${trackId}?market=US`);
  return { id: t.artists[0].id, nombre: t.artists[0].name };
}

async function discosDe(artistaId) {
  const discos = [];
  // Spotify responde 400 con limit > 10 en este endpoint. Tampoco ve las apariciones como invitada (appears_on).
  let url = `/artists/${artistaId}/albums?include_groups=album,single&market=US&limit=10`;
  while (url) {
    const pagina = await api(url);
    discos.push(...pagina.items);
    url = pagina.next ? pagina.next.replace('https://api.spotify.com/v1', '') : null;
  }
  return discos;
}

async function detalleDisco(id) {
  const a = await api(`/albums/${id}?market=US`);
  const pistas = [...a.tracks.items];
  let siguiente = a.tracks.next;
  while (siguiente) {
    const p = await api(siguiente.replace('https://api.spotify.com/v1', ''));
    pistas.push(...p.items);
    siguiente = p.next;
  }
  return {
    id: a.id,
    nombre: a.name,
    tipo: a.album_type,
    fecha: a.release_date,
    precision: a.release_date_precision,
    sello: a.label,
    total: a.total_tracks,
    pistas: pistas.map((p) => ({
      n: p.track_number,
      disco: p.disc_number,
      nombre: p.name,
      id: p.id,
      seg: Math.round(p.duration_ms / 1000),
      explicita: p.explicit,
      artistas: p.artists.map((x) => x.name),
    })),
  };
}

async function main() {
  const cat = await catalogo();

  const semillas = {
    blackpink: cat.albums.find((a) => a.slug === 'born-pink')?.tracks?.[0]?.spotifyId,
    jisoo: cat.miembros.jisoo.soloWorks.find((w) => w.spotifyId)?.spotifyId,
    jennie: cat.miembros.jennie.soloWorks.find((w) => w.spotifyId)?.spotifyId,
    rose: cat.miembros.rose.soloWorks.find((w) => w.slug === 'rose-r')?.spotifyId,
    lisa: cat.miembros.lisa.soloWorks.find((w) => w.spotifyId)?.spotifyId,
  };

  const informe = {};
  for (const [quien, semilla] of Object.entries(semillas)) {
    if (!semilla) {
      console.error(`! ${quien}: sin cancion contrastada de la que sacar la identidad`);
      continue;
    }
    const artista = await artistaDesde(semilla);
    const discos = await discosDe(artista.id);
    const detalles = [];
    for (const d of discos) detalles.push(await detalleDisco(d.id));
    detalles.sort((a, b) => a.fecha.localeCompare(b.fecha));
    informe[quien] = { artista, discos: detalles };

    console.log('');
    console.log('='.repeat(78));
    console.log(
      `  ${quien.toUpperCase()}  ->  ${artista.nombre} (${artista.id})  ·  ${detalles.length} lanzamientos`,
    );
    console.log('='.repeat(78));
    for (const d of detalles) {
      console.log(
        `  ${d.fecha.padEnd(10)} ${d.tipo.padEnd(7)} ${String(d.total).padStart(2)} pistas  ${d.nombre}`,
      );
      for (const p of d.pistas) {
        const otros = p.artistas.length > 1 ? `  [${p.artistas.join(', ')}]` : '';
        console.log(
          `      ${String(p.n).padStart(2)}. ${p.nombre}  (${Math.floor(p.seg / 60)}:${String(p.seg % 60).padStart(2, '0')})${otros}`,
        );
      }
    }
  }

  const i = process.argv.indexOf('--json');
  if (i !== -1) {
    writeFileSync(process.argv[i + 1], JSON.stringify(informe, null, 2));
    console.log(`\n  informe JSON: ${process.argv[i + 1]}`);
  }
}

main().catch((e) => {
  console.error('FALLO:', e.message);
  process.exit(1);
});
