import type { Locale } from '@blackpink/types';
import volcado from '../../../../services/content-service/prisma/seed-data/commons-gallery.json';

/**
 * ============================================================================
 * LOS DATOS DE LA GALERÍA
 * ============================================================================
 * POR QUÉ ESTO NO PASA POR content-service, que es la excepción a la regla del
 * proyecto y conviene justificarla: estas sesenta filas describen archivos que
 * viven en `apps/web/public/galeria/`, se generan con un script y se versionan
 * en el repositorio, exactamente igual que los volcados de Spotify. No cambian
 * si no cambia el commit.
 *
 * Meterlas en Postgres añadiría una migración, un módulo de Nest, una ruta en
 * la lista blanca del gateway y una clave de caché por idioma, todo para datos
 * que ya viajan al lado de los archivos que describen. La regla que sí se
 * respeta —y es la que importa— es que **la atribución tiene una sola fuente**:
 * el mismo fichero alimenta la rejilla, el lightbox y `/creditos`, así que no
 * pueden desincronizarse. Las fotos de integrantes siguen viniendo de la API,
 * que es su única fuente.
 *
 * EL ALT SE COMPONE, NO SE INVENTA. La descripción real de Commons es la única
 * afirmación que alguien ha hecho sobre lo que se ve en la foto, así que es lo
 * que se muestra; delante va un encabezado traducido con lo que sí sabemos —de
 * quién es la foto y de qué año—. Traducir las sesenta descripciones a mano
 * sería reescribir la afirmación de otro; inventarse lo que se ve sería peor.
 * ============================================================================
 */

export interface GalleryPhoto {
  id: string;
  /** Ruta pública, ya con `/galeria/`. */
  archivo: string;
  /** Medidas del archivo servido, medidas sobre sus bytes. */
  width: number;
  height: number;
  bytes: number;
  /** `grupo` o el slug de una integrante. De aquí sale el filtro. */
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

/** Orden de presentación: cronológico, que es como se lee una trayectoria. */
export function getGalleryPhotos(): GalleryPhoto[] {
  return [...DATOS.fotos].sort((a, b) => (a.fecha ?? '').localeCompare(b.fecha ?? ''));
}

/** Cuándo se generó el volcado. Va en `/creditos`. */
export function getGalleryDate(): string {
  return DATOS.generado;
}

/**
 * Nombres visibles de los temas.
 *
 * `grupo` no es un slug de integrante y por eso no puede salir de la API: se
 * traduce aquí. Los cuatro nombres artísticos no se traducen —JISOO es JISOO
 * en los tres idiomas— así que se escriben una vez.
 */
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

/**
 * El texto alternativo.
 *
 * `plantilla` trae el encabezado traducido con `{quien}` y `{ano}`; detrás va
 * la descripción de Commons tal cual. Si la foto no tiene año, la plantilla
 * corta sola: no se escribe «en null».
 */
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

/** Los años que existen de verdad en los datos, de mayor a menor. */
export function galleryYears(fotos: GalleryPhoto[]): number[] {
  const años = new Set<number>();
  for (const foto of fotos) if (foto.anio !== null) años.add(foto.anio);
  return [...años].sort((a, b) => b - a);
}

/** Formatea el crédito completo que exige la licencia. */
export function photoCredit(photo: GalleryPhoto): string {
  return `© ${photo.autor} · ${photo.licencia}`;
}

export type { Locale };
