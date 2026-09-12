// Datos de la galería leídos del volcado de Wikimedia Commons.

import type { Locale } from '@blackpink/types';
import volcado from '../../../backend/content-service/prisma/seed-data/commons-gallery.json';

export interface GalleryPhoto {
  id: string;
  archivo: string;
  width: number;
  height: number;
  bytes: number;
  subject: string;
  subjects: string[];
  anio: number | null;
  fecha: string | null;
  autor: string;
  licencia: string;
  familia: string;
  shareAlike: boolean;
  licenciaUrl: string | null;
  origen: string;
  tituloCommons: string;
  descripcion: string | null;
}

interface Volcado {
  generado: string;
  fotos: GalleryPhoto[];
}

const DATOS = volcado as unknown as Volcado;

export function getGalleryPhotos(): GalleryPhoto[] {
  return [...DATOS.fotos].sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''));
}

export function getGalleryDate(): string {
  return DATOS.generado;
}

export const GALLERY_SUBJECTS = ['grupo', 'jisoo', 'jennie', 'rose', 'lisa'] as const;

const NOMBRES: Record<string, string> = {
  jisoo: 'JISOO',
  jennie: 'JENNIE',
  rose: 'ROSÉ',
  lisa: 'LISA',
};

export function subjectLabel(subject: string, grupoLabel: string): string {
  return NOMBRES[subject] ?? grupoLabel;
}

export function photoAlt(
  photo: GalleryPhoto,
  plantilla: { conAno: string; sinAno: string },
  grupoLabel: string,
): string {
  const quien = subjectLabel(photo.subject, grupoLabel);
  const cabecera =
    photo.anio !== null
      ? plantilla.conAno.replace('{quien}', quien).replace('{ano}', String(photo.anio))
      : plantilla.sinAno.replace('{quien}', quien);

  return photo.descripcion ? `${cabecera}. ${photo.descripcion}` : cabecera;
}

export function galleryYears(fotos: GalleryPhoto[]): number[] {
  const años = new Set<number>();
  for (const foto of fotos) if (foto.anio !== null) años.add(foto.anio);
  return [...años].sort((a, b) => b - a);
}

export function photoCredit(photo: GalleryPhoto): string {
  return `© ${photo.autor} · ${photo.licencia}`;
}

export type { Locale };
