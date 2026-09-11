import type { Locale } from '@blackpink/types';

/**
 * ============================================================================
 * CONTRATO DEL PROVEEDOR DE TRANSCRIPCION
 * ============================================================================
 * El resto del servicio habla SOLO con esta interfaz. Ni el controlador ni la
 * validacion saben que detras hay Groq.
 *
 * Es la misma decision que en `chatbot-service/src/provider/ai-provider.ts` y
 * por la misma razon: permite cambiar de proveedor sin tocar nada mas, y
 * permite que los tests corran sin clave y sin red. Un test que necesita una
 * API externa acaba desactivado, y un test desactivado no protege nada.
 *
 * Aqui ademas hay un motivo concreto: Groq expone los MISMOS endpoints que
 * OpenAI para transcribir. Cambiar de uno a otro es cambiar la URL base y el
 * modelo, no reescribir el servicio. `WHISPER_PROVIDER` elige.
 * ============================================================================
 */

export interface TranscribeRequest {
  audio: Buffer;
  /** Nombre con extension real. El proveedor decide el decodificador por el. */
  filename: string;
  mimeType: string;
  /**
   * Pista de idioma, si el cliente sabe cual espera.
   *
   * Se manda solo cuando hay certeza. Forzar el idioma equivocado NO produce
   * un error: produce una transcripcion plausible y falsa -Whisper traduce o
   * transcribe fonéticamente-, que es mucho peor que un idioma mal detectado.
   */
  language?: Locale;
}

export interface TranscribeResult {
  text: string;
  /** Idioma que ha detectado el modelo, ya normalizado a los del sitio. */
  detectedLanguage: Locale;
  /**
   * 0 a 1. Es una ESTIMACION derivada de la probabilidad logaritmica media
   * que devuelve el modelo por segmento, no una certeza calibrada: sirve para
   * decidir si conviene que el visitante revise el texto, no para afirmar
   * nada. Ver `confidenceFrom` en el proveedor.
   */
  confidence: number;
  /** Duracion real del audio segun el proveedor, en segundos. */
  durationSec: number;
}

export interface AsrProvider {
  /** Nombre legible del proveedor y modelo, para diagnostico. No para el cliente. */
  describe(): string;

  /** true si hay credenciales configuradas. */
  isConfigured(): boolean;

  transcribe(request: TranscribeRequest, signal?: AbortSignal): Promise<TranscribeResult>;
}

export const ASR_PROVIDER = Symbol('ASR_PROVIDER');

/* ------------------------------------------------------------- errores --- */

/**
 * Errores traducidos a categorias que el servicio entiende.
 *
 * Se distinguen porque el visitante ve cosas distintas, y porque la respuesta
 * HTTP es distinta: una cuota agotada es temporal y se explica con honestidad
 * («vuelve en unos minutos», 429), mientras que una clave ausente es un fallo
 * de configuracion del sitio (503) ante el que el visitante no puede hacer
 * nada y no tiene sentido pedirle que reintente.
 */
export type AsrErrorKind =
  | 'not_configured'
  | 'quota'
  | 'upstream'
  | 'aborted'
  /** El proveedor acepto el audio y no encontro voz. No es un fallo tecnico. */
  | 'empty_audio';

export class AsrError extends Error {
  constructor(
    readonly kind: AsrErrorKind,
    message: string,
    /** Segundos que el proveedor pide esperar, si los dice. */
    readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'AsrError';
  }
}
