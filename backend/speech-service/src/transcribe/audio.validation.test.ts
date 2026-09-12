// Pruebas de la validación de audio.

import { describe, expect, it } from 'vitest';
import { probeDurationSec, sniffAudio } from './audio.validation';

const webm = () => Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0, 0, 0, 0, 0, 0, 0x1f]);
const ogg = () => Buffer.concat([Buffer.from('OggS', 'latin1'), Buffer.alloc(24)]);
const mp3Id3 = () => Buffer.concat([Buffer.from('ID3', 'latin1'), Buffer.alloc(24)]);
const mp3Sync = () => Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x00]), Buffer.alloc(16)]);

function mp4(brand: string): Buffer {
  const head = Buffer.alloc(16);
  head.writeUInt32BE(16, 0);
  head.write('ftyp', 4, 'latin1');
  head.write(brand, 8, 'latin1');
  return head;
}

function wav({ byteRate = 88200, dataBytes = 176400, junk = false } = {}): Buffer {
  const parts: Buffer[] = [];
  const riff = Buffer.alloc(12);
  riff.write('RIFF', 0, 'latin1');
  riff.write('WAVE', 8, 'latin1');
  parts.push(riff);

  if (junk) {
    const j = Buffer.alloc(8 + 4);
    j.write('JUNK', 0, 'latin1');
    j.writeUInt32LE(4, 4);
    parts.push(j);
  }

  const fmt = Buffer.alloc(8 + 16);
  fmt.write('fmt ', 0, 'latin1');
  fmt.writeUInt32LE(16, 4);
  fmt.writeUInt32LE(byteRate, 16);
  parts.push(fmt);

  const data = Buffer.alloc(8 + dataBytes);
  data.write('data', 0, 'latin1');
  data.writeUInt32LE(dataBytes, 4);
  parts.push(data);

  return Buffer.concat(parts);
}

function mp4WithDuration(seconds: number, timescale = 1000): Buffer {
  const mvhd = Buffer.alloc(8 + 4 + 16);
  mvhd.writeUInt32BE(mvhd.length, 0);
  mvhd.write('mvhd', 4, 'latin1');
  mvhd.writeUInt32BE(0, 8);
  mvhd.writeUInt32BE(timescale, 8 + 4 + 8);
  mvhd.writeUInt32BE(Math.round(seconds * timescale), 8 + 4 + 12);

  const moov = Buffer.alloc(8);
  moov.writeUInt32BE(8 + mvhd.length, 0);
  moov.write('moov', 4, 'latin1');

  return Buffer.concat([mp4('M4A '), moov, mvhd]);
}

describe('sniffAudio: el formato sale de los bytes, no de lo que diga el cliente', () => {
  it('reconoce webm por la cabecera EBML', () => {
    expect(sniffAudio(webm())).toEqual({ format: 'webm', mime: 'audio/webm', extension: 'webm' });
  });

  it('reconoce ogg', () => {
    expect(sniffAudio(ogg())?.format).toBe('ogg');
  });

  it('reconoce wav por RIFF....WAVE', () => {
    expect(sniffAudio(wav())?.format).toBe('wav');
  });

  it('reconoce mp3 con etiqueta ID3 y tambien sin ella', () => {
    expect(sniffAudio(mp3Id3())?.format).toBe('mp3');
    expect(sniffAudio(mp3Sync())?.format).toBe('mp3');
  });

  it('reconoce m4a y mp4 por la caja ftyp', () => {
    expect(sniffAudio(mp4('M4A '))?.format).toBe('m4a');
    expect(sniffAudio(mp4('mp42'))?.format).toBe('m4a');
    expect(sniffAudio(mp4('isom'))?.format).toBe('m4a');
  });

  describe('rechaza lo que no es audio admitido', () => {
    it('un ejecutable de Windows, aunque se llame .webm y se anuncie audio/webm', () => {
      const exe = Buffer.concat([Buffer.from('MZ', 'latin1'), Buffer.alloc(64, 0x41)]);
      expect(sniffAudio(exe)).toBeNull();
    });

    it('un ELF de Linux', () => {
      const elf = Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46]), Buffer.alloc(32)]);
      expect(sniffAudio(elf)).toBeNull();
    });

    it('un PNG', () => {
      const png = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.alloc(16),
      ]);
      expect(sniffAudio(png)).toBeNull();
    });

    it('un RIFF que no es WAVE (un AVI, por ejemplo)', () => {
      const avi = Buffer.alloc(16);
      avi.write('RIFF', 0, 'latin1');
      avi.write('AVI ', 8, 'latin1');
      expect(sniffAudio(avi)).toBeNull();
    });

    it('un mp4 cuya marca no reconocemos', () => {
      expect(sniffAudio(mp4('qt  '))).toBeNull();
    });

    it('un fichero vacio o demasiado corto para decidir nada', () => {
      expect(sniffAudio(Buffer.alloc(0))).toBeNull();
      expect(sniffAudio(Buffer.from([0x1a, 0x45]))).toBeNull();
    });
  });
});

describe('probeDurationSec', () => {
  it('mide un wav exacto: bytes de datos entre bytes por segundo', () => {
    expect(probeDurationSec(wav(), 'wav')).toBeCloseTo(2, 5);
  });

  it('encuentra fmt aunque haya trozos delante', () => {
    expect(probeDurationSec(wav({ junk: true }), 'wav')).toBeCloseTo(2, 5);
  });

  it('mide un mp4 por su caja mvhd', () => {
    expect(probeDurationSec(mp4WithDuration(42), 'm4a')).toBeCloseTo(42, 3);
  });

  it('devuelve null para webm, ogg y mp3: se comprueban despues', () => {
    expect(probeDurationSec(webm(), 'webm')).toBeNull();
    expect(probeDurationSec(ogg(), 'ogg')).toBeNull();
    expect(probeDurationSec(mp3Id3(), 'mp3')).toBeNull();
  });

  it('devuelve null, no una excepcion, ante un contenedor corrupto', () => {
    const roto = Buffer.concat([Buffer.from('RIFF', 'latin1'), Buffer.from('WAVE', 'latin1')]);
    expect(probeDurationSec(roto, 'wav')).toBeNull();
  });
});
