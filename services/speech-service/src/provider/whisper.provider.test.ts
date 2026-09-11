import { describe, expect, it } from 'vitest';
import { confidenceFrom, normalizeLocale } from './whisper.provider';

/**
 * Dos funciones puras, y las dos existen por algo que se comprobo contra la
 * API de verdad, no por simetria.
 */

describe('normalizeLocale', () => {
  /*
   * ESTO NO ES HIPOTETICO. Groq devuelve el NOMBRE del idioma en ingles
   * -«Spanish», «English»-, no el codigo ISO que promete la documentacion de
   * OpenAI. Comprobado el 1/9/2026 contra whisper-large-v3 y su variante
   * turbo: las cuatro llamadas devolvieron `"language": "Spanish"`.
   *
   * Si aqui solo se aceptaran codigos, TODA transcripcion caeria al ingles y
   * PINKY contestaria en ingles a quien le hablase en español. Y no fallaria
   * nada: solo estaria mal.
   */
  it('acepta el nombre en ingles, que es lo que devuelve Groq', () => {
    expect(normalizeLocale('Spanish')).toBe('es');
    expect(normalizeLocale('English')).toBe('en');
    expect(normalizeLocale('Korean')).toBe('ko');
  });

  it('acepta tambien el codigo ISO, que es lo que documenta OpenAI', () => {
    expect(normalizeLocale('es')).toBe('es');
    expect(normalizeLocale('ko')).toBe('ko');
  });

  it('ignora la region: el idioma es el mismo', () => {
    expect(normalizeLocale('es-ES')).toBe('es');
    expect(normalizeLocale('es_MX')).toBe('es');
    expect(normalizeLocale('ko-KR')).toBe('ko');
  });

  it('no distingue mayusculas', () => {
    expect(normalizeLocale('KOREAN')).toBe('ko');
    expect(normalizeLocale('Castilian')).toBe('es');
  });

  it('cae al INGLES, no al español, con un idioma que el sitio no tiene', () => {
    // Misma regla que `content-service` para el contenido sin traducir: entre
    // los tres idiomas del sitio, el ingles es la lengua franca.
    expect(normalizeLocale('Japanese')).toBe('en');
    expect(normalizeLocale('fr')).toBe('en');
    expect(normalizeLocale(undefined)).toBe('en');
    expect(normalizeLocale('')).toBe('en');
  });
});

describe('confidenceFrom', () => {
  /*
   * Los numeros de abajo son los de una medicion real: el mismo audio de 4.2s
   * en español, con ruido gaussiano anadido a distintas relaciones
   * senal/ruido. La confianza calculada bajo de 0.96 a 0.50 mientras el texto
   * pasaba de correcto a irreconocible, que es lo que se le pide: que sirva
   * para decidir si conviene revisar el texto antes de enviarlo.
   */
  const segment = (avg: number, extra: Partial<Record<string, number>> = {}) => ({
    avg_logprob: avg,
    start: 0,
    end: 4,
    ...extra,
  });

  it('sube cuando el modelo esta seguro', () => {
    expect(confidenceFrom({ segments: [segment(Math.log(0.96))] })).toBeCloseTo(0.96, 2);
  });

  it('baja cuando no lo esta', () => {
    expect(confidenceFrom({ segments: [segment(Math.log(0.5))] })).toBeCloseTo(0.5, 2);
  });

  it('penaliza un segmento que el modelo cree que es silencio', () => {
    // Whisper inventa frases enteras sobre ruido de fondo, y esa es justo la
    // transcripcion que conviene mirar antes de mandarla.
    const seguro = confidenceFrom({ segments: [segment(Math.log(0.9))] });
    const dudoso = confidenceFrom({ segments: [segment(Math.log(0.9), { no_speech_prob: 0.8 })] });
    expect(dudoso).toBeLessThan(seguro);
  });

  it('pondera por duracion: un segmento largo y dudoso pesa mas que una interjeccion', () => {
    const resultado = confidenceFrom({
      segments: [
        { avg_logprob: Math.log(0.2), start: 0, end: 9 },
        { avg_logprob: Math.log(1.0), start: 9, end: 10 },
      ],
    });
    // La media simple daria 0.6; ponderada por duracion, 0.28.
    expect(resultado).toBeLessThan(0.35);
  });

  it('devuelve 0 sin segmentos: preferimos decir "no lo se" a inventar un 0.9', () => {
    expect(confidenceFrom({})).toBe(0);
    expect(confidenceFrom({ segments: [] })).toBe(0);
  });

  it('nunca sale del rango 0..1', () => {
    expect(confidenceFrom({ segments: [segment(5)] })).toBeLessThanOrEqual(1);
    expect(confidenceFrom({ segments: [segment(-50)] })).toBeGreaterThanOrEqual(0);
  });
});
