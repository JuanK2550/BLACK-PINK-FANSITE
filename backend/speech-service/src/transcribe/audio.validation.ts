// Comprueba formato y duración del audio leyendo sus bytes.

export type AudioFormat = 'webm' | 'ogg' | 'wav' | 'mp3' | 'm4a';

export interface SniffResult {
  format: AudioFormat;
  mime: string;
  extension: string;
}

const ascii = (bytes: Buffer, from: number, length: number): string =>
  bytes.subarray(from, from + length).toString('latin1');

export function sniffAudio(bytes: Buffer): SniffResult | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { format: 'webm', mime: 'audio/webm', extension: 'webm' };
  }

  if (ascii(bytes, 0, 4) === 'OggS') {
    return { format: 'ogg', mime: 'audio/ogg', extension: 'ogg' };
  }

  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WAVE') {
    return { format: 'wav', mime: 'audio/wav', extension: 'wav' };
  }

  if (ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4);
    if (/^(M4A|mp4|iso|dash|M4B|avc)/i.test(brand)) {
      return { format: 'm4a', mime: 'audio/mp4', extension: 'm4a' };
    }
    return null;
  }

  if (ascii(bytes, 0, 3) === 'ID3') {
    return { format: 'mp3', mime: 'audio/mpeg', extension: 'mp3' };
  }
  if (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0) {
    return { format: 'mp3', mime: 'audio/mpeg', extension: 'mp3' };
  }

  return null;
}

export function probeDurationSec(bytes: Buffer, format: AudioFormat): number | null {
  try {
    if (format === 'wav') return wavDuration(bytes);
    if (format === 'm4a') return mp4Duration(bytes);
  } catch {
    return null;
  }
  return null;
}

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
      const real = Math.min(size || Infinity, bytes.length - offset - 8);
      return real / byteRate;
    }

    offset += 8 + size + (size % 2);
  }

  return null;
}

function mp4Duration(bytes: Buffer): number | null {
  const found = findBox(bytes, 0, bytes.length, 'moov');
  if (!found) return null;

  const mvhd = findBox(bytes, found.start, found.end, 'mvhd');
  if (!mvhd) return null;

  const version = bytes[mvhd.start];
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
