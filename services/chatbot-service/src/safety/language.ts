import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';

/**
 * ============================================================================
 * DETECCION DE IDIOMA
 * ============================================================================
 * PINKY responde en el idioma en que le hablan, no en el idioma en que esta
 * puesta la interfaz. Alguien puede navegar en ingles y preguntar en coreano;
 * contestarle en ingles seria tecnicamente coherente y humanamente absurdo.
 *
 * Se hace con reglas, no con una libreria ni con una llamada al modelo:
 *
 *   - Son TRES idiomas conocidos de antemano, y dos de ellos ni siquiera
 *     comparten alfabeto. El caso dificil de la deteccion de idioma -mil
 *     idiomas, textos de dos palabras- aqui no existe.
 *   - Una llamada extra al modelo por cada mensaje duplicaria el gasto de
 *     cuota para resolver algo que decide un rango unicode.
 *
 * CUANDO NO ESTA CLARO, MANDA EL IDIOMA DE LA INTERFAZ. Un "ok" o un "gracias"
 * no identifican nada, y en la duda lo razonable es seguir en el idioma en el
 * que el visitante esta leyendo el sitio.
 * ============================================================================
 */

/** Hangul: silabas, jamo y jamo compatible. */
const HANGUL = /[가-힯ᄀ-ᇿ㄰-㆏]/;

/** Marcas que solo aparecen en castellano. */
const SPANISH_CHARS = /[¿¡ñáéíóúü]/i;

const SPANISH_WORDS =
  /\b(que|como|cuando|donde|cual|cuales|quien|por|para|del|los|las|una|con|sobre|hay|tiene|tienen|cuantos|cuantas|album|cancion|integrante|dime|cuentame|muestrame)\b/;

const ENGLISH_WORDS =
  /\b(the|what|when|where|which|who|how|and|for|with|about|there|have|has|does|did|show|tell|many|much|song|album|member|you|your|are|is|was|can|could|would|please|give|want|know|all|this|that|previous|instructions|now|from|they|their)\b/;

export interface LanguageVerdict {
  locale: Locale;
  /** true si la deteccion decidio; false si se cayo al idioma de la interfaz. */
  detected: boolean;
}

/**
 * Idioma del mensaje.
 *
 * @param message  Lo que escribio el visitante.
 * @param fallback Idioma de la interfaz, que manda cuando no hay senal.
 */
export function detectLanguage(message: string, fallback: Locale): LanguageVerdict {
  const text = message.toLowerCase();

  /*
   * El hangul decide solo, y sin exigir un minimo de caracteres: nadie escribe
   * en coreano por accidente. Va primero porque una pregunta coreana puede
   * contener titulos latinos ("BORN PINK에는 어떤 곡이") y las reglas de abajo
   * los verian como texto ingles.
   */
  if (HANGUL.test(message)) return { locale: 'ko', detected: true };

  // Un solo caracter propio del castellano basta: no existe en ingles.
  if (SPANISH_CHARS.test(message)) return { locale: 'es', detected: true };

  const spanish = countMatches(text, SPANISH_WORDS);
  const english = countMatches(text, ENGLISH_WORDS);

  if (spanish > english) return { locale: 'es', detected: true };
  if (english > spanish) return { locale: 'en', detected: true };

  // Empate -incluido el empate a cero: "ok", "BORN PINK"- manda la interfaz.
  return { locale: normalize(fallback), detected: false };
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(new RegExp(pattern.source, 'g')) ?? []).length;
}

function normalize(value: string): Locale {
  return SUPPORTED_LOCALES.includes(value as Locale) ? (value as Locale) : 'en';
}
