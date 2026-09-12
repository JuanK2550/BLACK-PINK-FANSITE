// Pruebas de los datos de la galería.

import { describe, expect, it } from 'vitest';
import {
  galleryYears,
  getGalleryPhotos,
  photoAlt,
  photoCredit,
  subjectLabel,
  type GalleryPhoto,
} from './gallery';

const FOTO: GalleryPhoto = {
  id: 'abc',
  archivo: '/galeria/x.jpg',
  width: 1400,
  height: 900,
  bytes: 100_000,
  subject: 'jisoo',
  subjects: ['jisoo'],
  anio: 2019,
  fecha: '2019-05-18',
  autor: 'Alguien',
  licencia: 'CC BY-SA 4.0',
  familia: 'CC BY-SA',
  shareAlike: true,
  licenciaUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
  origen: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  tituloCommons: 'File:X.jpg',
  descripcion: 'Jisoo en el escenario',
};

const PLANTILLA = { conAno: '{quien} en {ano}', sinAno: '{quien}, fotografia' };

describe('photoAlt', () => {
  it('encabeza con quien y cuando, y deja la descripcion real detras', () => {
    expect(photoAlt(FOTO, PLANTILLA, 'El grupo')).toBe('JISOO en 2019. Jisoo en el escenario');
  });

  it('sin ano no escribe «en null»', () => {
    const sinFecha = { ...FOTO, anio: null };
    expect(photoAlt(sinFecha, PLANTILLA, 'El grupo')).toBe(
      'JISOO, fotografia. Jisoo en el escenario',
    );
  });

  it('sin descripcion se queda solo con el encabezado', () => {
    const sinTexto = { ...FOTO, descripcion: null };
    expect(photoAlt(sinTexto, PLANTILLA, 'El grupo')).toBe('JISOO en 2019');
  });

  it('el grupo usa la etiqueta traducida y no un slug', () => {
    const grupo = { ...FOTO, subject: 'grupo' };
    expect(photoAlt(grupo, PLANTILLA, 'El grupo')).toMatch(/^El grupo en 2019/);
  });
});

describe('subjectLabel', () => {
  it('los nombres artisticos no se traducen', () => {
    expect(subjectLabel('rose', 'El grupo')).toBe('ROSÉ');
    expect(subjectLabel('lisa', 'The group')).toBe('LISA');
  });
});

describe('photoCredit', () => {
  it('nombra la licencia de ESA foto, no una generica', () => {
    expect(photoCredit(FOTO)).toBe('© Alguien · CC BY-SA 4.0');
  });
});

describe('galleryYears', () => {
  it('ordena de mas reciente a mas antiguo y no repite', () => {
    const fotos = [
      { ...FOTO, anio: 2019 },
      { ...FOTO, anio: 2023 },
      { ...FOTO, anio: 2019 },
      { ...FOTO, anio: null },
    ];
    expect(galleryYears(fotos)).toEqual([2023, 2019]);
  });
});

describe('el volcado real', () => {
  const fotos = getGalleryPhotos();

  it('tiene fotos', () => {
    expect(fotos.length).toBeGreaterThan(0);
  });

  it('SOLO licencias libres', () => {
    const familias = new Set(fotos.map((f) => f.familia));
    for (const familia of familias) {
      expect(['CC BY', 'CC BY-SA', 'CC0', 'Dominio publico']).toContain(familia);
    }
  });

  it('todas traen autor, origen y medidas', () => {
    for (const foto of fotos) {
      expect(foto.autor).toBeTruthy();
      expect(foto.origen).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(foto.width).toBeGreaterThan(0);
      expect(foto.height).toBeGreaterThan(0);
    }
  });

  it('ninguna esta ampliada por encima del ancho servido', () => {
    for (const foto of fotos) expect(foto.width).toBeLessThanOrEqual(1400);
  });

  it('ninguna pesa mas de 700 KB', () => {
    for (const foto of fotos) expect(foto.bytes).toBeLessThan(700 * 1024);
  });

  it('viene ordenado cronologicamente', () => {
    const fechas = fotos.map((f) => f.fecha ?? '');
    expect([...fechas].sort()).toEqual(fechas);
  });
});
