/**
 * ============================================================================
 * QUE ES DE VERDAD ESTE FICHERO
 * ============================================================================
 * POR QUE NO SE MIRA NI LA EXTENSION NI EL `content-type`. Las dos las escribe
 * el cliente, y el cliente puede ser cualquiera: `curl` manda el `content-type`
 * que se le diga. Un ejecutable renombrado a `.webm` y anunciado como
 * `audio/webm` pasaria las dos comprobaciones y llegaria al proveedor.
 *
 * Lo unico que no miente son los primeros bytes del fichero, porque los
 * escribe el codificador y sin ellos ningun decodificador sabria abrirlo. Eso
 * es lo que se mira aqui.
 *
 * EL `content-type` DEL CLIENTE NO SE USA PARA NADA mas que para el mensaje de
 * error. El que viaja al proveedor es el que se deduce de los bytes.
 * ============================================================================
 */

/** Los contenedores admitidos. `mime` es el que se enviara aguas arriba. */
export type AudioFormat = 'webm' | 'ogg' | 'wav' | 'mp3' | 'm4a';

export interface SniffResult {
  format: AudioFormat;
  mime: string;
  /** Extension canonica. El proveedor elige decodificador por ella. */
  extension: string;
}

const ascii = (bytes: Buffer, from: number, length: number): string =>
  bytes.subarray(from, from + length).toString('latin1');

/**
 * El formato real, deducido de los bytes.
 *
 * `null` si no es ninguno de los admitidos: da igual si es un formato de audio
 * que no aceptamos o un ejecutable, la respuesta al cliente es la misma.
 * Detallar cual de las dos cosas es solo ayudaria a quien esta probando.
 */
export function sniffAudio(bytes: Buffer): SniffResult | null {
  if (bytes.length < 12) return null;

  // EBML: la cabecera de Matroska, y WebM es un perfil de Matroska. Es lo que
  // produce MediaRecorder en Chrome y Firefox.
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { format: 'webm', mime: 'audio/webm', extension: 'webm' };
  }

  if (ascii(bytes, 0, 4) === 'OggS') {
    return { format: 'ogg', mime: 'audio/ogg', extension: 'ogg' };
  }

  // RIFF....WAVE. Los cuatro bytes de en medio son el tamano, y no se miran:
  // un tamano declarado tampoco es una fuente fiable.
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WAVE') {
    return { format: 'wav', mime: 'audio/wav', extension: 'wav' };
  }

  // MP4 y sus parientes: la caja `ftyp` va al principio, precedida de su
  // tamano. Es lo que produce MediaRecorder en Safari.
  if (ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4);
    // `M4A `, `mp42`, `isom`, `mp41`, `dash`... Todos abren en el mismo
    // decodificador; el unico que se descarta es el que no es audio.
    if (/^(M4A|mp4|iso|dash|M4B|avc)/i.test(brand)) {
      return { format: 'm4a', mime: 'audio/mp4', extension: 'm4a' };
    }
    return null;
  }

  // MP3 de dos maneras: con etiqueta ID3 delante, o empezando directamente
  // por la sincronia de trama (11 bits a uno).
  if (ascii(bytes, 0, 3) === 'ID3') {
    return { format: 'mp3', mime: 'audio/mpeg', extension: 'mp3' };
  }
  if (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0) {
    return { format: 'mp3', mime: 'audio/mpeg', extension: 'mp3' };
  }

  return null;
}

/* ------------------------------------------------------------ duracion --- */

/**
 * Duracion exacta, cuando se puede saber sin decodificar.
 *
 * DEVUELVE `null` A PROPOSITO PARA WEBM, OGG Y MP3, y no es dejadez: en esos
 * tres, saber la duracion exige recorrer el contenedor entero -contar tramas
 * en MP3, leer la ultima pagina en OGG, interpretar enteros de longitud
 * variable en EBML-. Escribir tres analizadores de contenedor, cada uno con
 * sus casos raros, es mas superficie de fallo que la que resuelve.
 *
 * Para esos tres, la duracion se comprueba DESPUES, con la que informa el
 * proveedor. Cuesta una llamada a la API que se descarta, y lo que acota ese
 * coste es el limite de peticiones por IP, no esta funcion.
 *
 * WAV y MP4 si se resuelven aqui, exactos y en veinte lineas, y son justo los
 * dos formatos que puede adjuntar alguien desde su disco.
 */
export function probeDurationSec(bytes: Buffer, format: AudioFormat): number | null {
  try {
    if (format === 'wav') return wavDuration(bytes);
    if (format === 'm4a') return mp4Duration(bytes);
  } catch {
    // Un contenedor corrupto no es motivo para responder 500: se deja pasar a
    // la comprobacion posterior, que es la que decide con datos reales.
    return null;
  }
  return null;
}

/**
 * WAV: se busca la cabecera `fmt ` (bytes por segundo) y el trozo `data`
 * (bytes de audio). La division es la duracion.
 *
 * No se asume que `fmt ` este en el offset 12: puede haber trozos `LIST` o
 * `JUNK` delante, y los hay en cuanto el fichero pasa por un editor.
 */
function wavDuration(bytes: Buffer): number | null {
  let offset = 12;
  let byteRate = 0;

  while (offset + 8 <= bytes.length) {
    const id = ascii(bytes, offset, 4);
    const size = bytes.readUInt32LE(offset + 4);

    if (id === 'fmt ' && offset + 16 <= bytes.length) {
      byteRate = bytes.readUInt32LE(offset + 16);
    }

    if (id === 'data') {
      if (byteRate === 0) return null;
      // El tamano declarado puede mentir o venir a cero en un flujo: se toma
      // el menor entre lo declarado y lo que de verdad hay.
      const real = Math.min(size || Infinity, bytes.length - offset - 8);
      return real / byteRate;
    }

    // Los trozos se alinean a dos bytes.
    offset += 8 + size + (size % 2);
  }

  return null;
}

/**
 * MP4/M4A: la caja `mvhd` lleva escala de tiempo y duracion. Se busca dentro
 * de `moov`, recorriendo cajas por su tamano.
 *
 * Ojo con el orden: en un fichero optimizado para reproducirse por red `moov`
 * va al principio, pero por defecto va al FINAL, detras de todo el audio. Por
 * eso se recorre en vez de mirar un offset fijo.
 */
function mp4Duration(bytes: Buffer): number | null {
  const found = findBox(bytes, 0, bytes.length, 'moov');
  if (!found) return null;

  const mvhd = findBox(bytes, found.start, found.end, 'mvhd');
  if (!mvhd) return null;

  const version = bytes[mvhd.start];
  // v0 guarda enteros de 32 bits; v1, de 64. La diferencia son 8 bytes.
  const base = mvhd.start + 4;

  if (version === 1) {
    if (base + 28 > bytes.length) return null;
    const timescale = bytes.readUInt32BE(base + 16);
    const duration = Number(bytes.readBigUInt64BE(base + 20));
    return timescale > 0 ? duration / timescale : null;
  }

  if (base + 16 > bytes.length) return null;
  const timescale = bytes.readUInt32BE(base + 8);
  const duration = bytes.readUInt32BE(base + 12);
  return timescale > 0 ? duration / timescale : null;
}

/** Busca una caja por nombre entre dos offsets. Solo el primer nivel. */
function findBox(
  bytes: Buffer,
  from: number,
  to: number,
  name: string,
): { start: number; end: number } | null {
  let offset = from;

  while (offset + 8 <= to) {
    const size = bytes.readUInt32BE(offset);
    const id = ascii(bytes, offset + 4, 4);

    // Tamano 0 = «hasta el final»; 1 = el tamano real va en 64 bits detras.
    let header = 8;
    let total = size;
    if (size === 1) {
      if (offset + 16 > to) return null;
      total = Number(bytes.readBigUInt64BE(offset + 8));
      header = 16;
    } else if (size === 0) {
      total = to - offset;
    }

    if (total < header) return null;
    if (id === name) return { start: offset + header, end: Math.min(offset + total, to) };

    offset += total;
  }

  return null;
}
