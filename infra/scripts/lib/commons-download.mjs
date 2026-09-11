/**
 * ============================================================================
 * DESCARGA Y VOLCADO DE LA GALERIA
 * ============================================================================
 * Vive aparte de `commons-gallery.mjs` para que la ejecucion en seco no toque
 * el disco ni por accidente: si el codigo que escribe no esta cargado, no
 * puede escribir.
 *
 * SE REESCALA AQUI, Y HUBO QUE MEDIRLO PARA SABERLO. A Commons se le pide la
 * imagen con `iiurlwidth`, y para los JPEG cumple; para los PNG grandes NO
 * genera miniatura y devuelve el original. La primera descarga completa dio
 * 51,5 MB para sesenta fotos -879 KB de media, con PNG sueltos de 5,2 MB-, que
 * en una galeria es exactamente donde se hunde el LCP.
 *
 * Todo sale JPEG. Un PNG es el formato equivocado para una fotografia: guarda
 * sin perdida lo que el ojo no distingue y pesa cinco veces mas. Con calidad
 * 82 y 1400px de ancho maximo, las mismas sesenta bajan a una fraccion.
 *
 * Y ADEMAS ES LO QUE PIDE LA LICENCIA. Once de las sesenta son CC BY-SA:
 * ShareAlike se activa sobre las obras DERIVADAS, y aunque redimensionar no
 * cree una (Creative Commons lo dice en sus propias FAQ: un cambio de tamano
 * es reproduccion, no adaptacion), RECORTAR si la crearia. Aqui no se recorta
 * nada, nunca, y por eso ninguna de las sesenta arrastra obligaciones nuevas.
 *
 * LAS MEDIDAS SE MIDEN SOBRE LOS BYTES DESCARGADOS. Es la misma leccion que
 * las portadas de Spotify: la API declaraba un tamano y servia otro, y sin las
 * medidas de lo que de verdad se sirve la rejilla salta al cargar. Aqui pasa
 * lo mismo por otro motivo -Commons redondea el alto de sus miniaturas-, asi
 * que se lee la cabecera del archivo y punto.
 * ============================================================================
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/** Ancho maximo servido. Por encima, una galeria no gana nitidez: gana peso. */
const ANCHO_MAX = 1400;
/** 82 es donde el artefacto deja de verse en una foto de concierto. */
const CALIDAD = 82;

const USER_AGENT =
  'BlackpinkFansite/1.0 (sitio de fans no oficial; https://github.com/JuanK2550) node-fetch';

/**
 * Medidas reales leidas de la cabecera del archivo.
 *
 * PNG lleva el bloque IHDR en una posicion fija; JPEG obliga a recorrer sus
 * segmentos hasta dar con un marcador SOF, que es el unico que las trae.
 */
function medir(bytes) {
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
      // SOF0..SOF15, excluyendo DHT (c4), JPG (c8) y DAC (cc), que no lo son.
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
}

/** Serializacion canonica: claves ordenadas, dos espacios. Igual que Spotify. */
function serializar(valor) {
  if (Array.isArray(valor)) return valor.map(serializar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.keys(valor)
        .sort()
        .map((k) => [k, serializar(valor[k])]),
    );
  }
  return valor;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function descargar(elegidas, { destino, volcado }) {
  mkdirSync(destino, { recursive: true });

  const filas = [];
  let bytesTotales = 0;
  let fallos = 0;

  for (const [indice, foto] of elegidas.entries()) {
    process.stderr.write(
      `  [${String(indice + 1).padStart(2)}/${elegidas.length}] ${foto.archivo.slice(0, 46).padEnd(46)}`,
    );

    try {
      const res = await fetch(foto.descargaUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const original = Buffer.from(await res.arrayBuffer());

      /*
       * `withoutEnlargement` es la linea que impide servir una foto ampliada:
       * si el original mide menos de 1400, se queda como esta. Ampliar no
       * anade detalle, solo peso y desenfoque.
       */
      const bytes = await sharp(original)
        .resize({ width: ANCHO_MAX, withoutEnlargement: true })
        .jpeg({ quality: CALIDAD, mozjpeg: true })
        .toBuffer();

      // Las medidas, sobre los bytes que se van a servir de verdad.
      const medidas = medir(bytes);
      if (!medidas) throw new Error('no se pudieron leer las medidas');

      writeFileSync(path.join(destino, foto.archivo), bytes);
      bytesTotales += bytes.length;

      filas.push({
        id: foto.id,
        archivo: `/galeria/${foto.archivo}`,
        // Las medidas de lo que se sirve, medidas sobre los bytes.
        width: medidas.width,
        height: medidas.height,
        bytes: bytes.length,
        subject: foto.subjects[0],
        subjects: foto.subjects,
        anio: foto.anio,
        fecha: foto.fecha,
        autor: foto.autor,
        licencia: foto.licencia,
        familia: foto.familia,
        shareAlike: foto.shareAlike,
        licenciaUrl: foto.licenciaUrl,
        origen: foto.origen,
        tituloCommons: foto.titulo,
        descripcion: foto.descripcion,
      });

      process.stderr.write(
        ` ${medidas.width}x${medidas.height}  ${(bytes.length / 1024).toFixed(0)} KB\n`,
      );
    } catch (error) {
      fallos += 1;
      process.stderr.write(` ! ${error.message}\n`);
    }

    // La misma cortesia que con la API: es su ancho de banda.
    await espera(250);
  }

  const contenido = {
    _nota:
      'Generado por infra/scripts/commons-gallery.mjs. MANDA ESTE FICHERO: el script es la ' +
      'forma de actualizarlo, nunca al reves. Cada fila lleva su licencia y su origen porque ' +
      'la atribucion es una obligacion, no un adorno.',
    generado: new Date().toISOString().slice(0, 10),
    fotos: filas.sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? '')),
  };

  writeFileSync(volcado, `${JSON.stringify(serializar(contenido), null, 2)}\n`, 'utf8');

  console.log('');
  console.log(`  descargadas   ${filas.length}`);
  if (fallos) console.log(`  fallidas      ${fallos}`);
  console.log(`  peso total    ${(bytesTotales / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  media         ${(bytesTotales / filas.length / 1024).toFixed(0)} KB por imagen`);
  console.log(`  volcado       ${path.relative(process.cwd(), volcado)}`);
  console.log('');
}
