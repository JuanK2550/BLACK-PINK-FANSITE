// Tipos y fuentes comunes de los datos semilla.

export interface Translated {
  es: string;
  en: string;
  ko: string;
}

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
  pending:
    'Conocimiento publico ampliamente difundido. PENDIENTE de contrastar contra fuente primaria antes de publicarlo.',
  pendingDate:
    'El hecho esta documentado, pero la fecha exacta esta PENDIENTE de contrastar. Se guarda con la precision realmente conocida.',
  siteChoice:
    'Decision de presentacion de este sitio de fans. No es informacion oficial del grupo.',
} as const;

export function day(iso: `${number}-${number}-${number}`): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
