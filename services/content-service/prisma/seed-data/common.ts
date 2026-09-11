/**
 * ============================================================================
 * DATOS SEMILLA - CONVENCIONES
 * ============================================================================
 *
 * QUE SIGNIFICA `verified`
 *
 *   true  -> dato estable, ampliamente documentado en fuentes publicas, que
 *            el sitio da por bueno y publica.
 *   false -> el dato es probablemente correcto pero NO se ha contrastado
 *            contra una fuente primaria, o la fecha exacta no esta confirmada.
 *            El sitio no lo publica por defecto: se filtra por `verified`.
 *
 * La regla del proyecto es explicita: **antes marcarlo como no verificado que
 * inventarlo**. Pocos datos correctos valen mas que muchos dudosos. Si al
 * contrastar un dato resulta falso, se corrige o se borra; nunca se deja
 * publicado "porque ya estaba".
 *
 * QUE SIGNIFICA `source`
 *
 *   De donde sale el dato, en texto legible, para que cualquiera pueda
 *   comprobarlo sin abrir la base de datos. En `trivia` es obligatorio a nivel
 *   de base de datos (NOT NULL + CHECK de longitud): un dato sin fuente no es
 *   un dato, es un rumor.
 *
 * QUE NO ENTRA AQUI NUNCA
 *
 *   Direcciones, telefonos, ubicaciones, documentos, relaciones personales ni
 *   ningun otro dato privado de nadie. Solo informacion publica sobre la
 *   carrera profesional del grupo.
 * ============================================================================
 */

/** Texto en los tres idiomas del sitio. */
export interface Translated {
  es: string;
  en: string;
  ko: string;
}

/** Texto trilingue opcional (por ejemplo una descripcion que no siempre hay). */
export type TranslatedOptional = Partial<Translated>;

export const SOURCES = {
  official:
    'Canales oficiales del grupo y de YG Entertainment (blackpinkofficial.com y canal de YouTube @BLACKPINK).',
  discography:
    'Fichas de lanzamiento publicadas por YG Entertainment y catalogos publicos de Spotify y YouTube Music.',
  press:
    'Cobertura de prensa musical internacional (Billboard, Rolling Stone, NME) en la fecha del hecho.',
  festival: 'Carteles y comunicados oficiales del festival correspondiente.',
  netflix: 'Ficha publica del titulo en Netflix.',
  /**
   * Para todo lo que se sabe pero no se ha contrastado. Siempre acompanado de
   * verified: false.
   */
  pending:
    'Conocimiento publico ampliamente difundido. PENDIENTE de contrastar contra fuente primaria antes de publicarlo.',
  /** Para fechas conocidas solo por mes o por ano. */
  pendingDate:
    'El hecho esta documentado, pero la fecha exacta esta PENDIENTE de contrastar. Se guarda con la precision realmente conocida.',
  /** Para decisiones del propio sitio, no del grupo. */
  siteChoice:
    'Decision de presentacion de este sitio de fans. No es informacion oficial del grupo.',
} as const;

/** Construye una fecha UTC sin dependencia de la zona horaria de la maquina. */
export function day(iso: `${number}-${number}-${number}`): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
