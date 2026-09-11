/**
 * ============================================================================
 * CONTRATO DEL PROVEEDOR DE IA
 * ============================================================================
 * El resto del servicio habla SOLO con esta interfaz. Ni el controlador, ni el
 * indexador, ni la recuperacion saben que detras hay Gemini.
 *
 * No es purismo: es lo que permite cambiar de proveedor sin tocar el RAG, y lo
 * que permite que los tests corran sin clave y sin red. Un test que necesita
 * una API externa acaba desactivado, y un test desactivado no protege nada.
 *
 * Por eso los tipos de aqui son deliberadamente pobres: texto que entra, texto
 * que sale, y un vector de numeros. Nada de la forma concreta que tenga la
 * peticion de Google.
 * ============================================================================
 */

/** Un turno de conversacion, ya normalizado. */
export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface ChatRequest {
  /** Instrucciones del sistema. NUNCA sale de aqui hacia el cliente. */
  system: string;
  history: ChatTurn[];
  message: string;
}

export interface EmbedRequest {
  texts: string[];
  /**
   * Un embedding de documento y uno de consulta se optimizan distinto en el
   * mismo modelo. Indexar y preguntar con el mismo tipo empeora la
   * recuperacion de forma silenciosa: sigue devolviendo resultados, solo que
   * peores.
   */
  purpose: 'document' | 'query';
}

export interface AiProvider {
  /** Nombre legible del proveedor y modelo, para diagnostico. No para el cliente. */
  describe(): string;

  /** true si hay credenciales configuradas. */
  isConfigured(): boolean;

  /** Genera texto en trozos, segun van llegando. */
  streamChat(request: ChatRequest, signal?: AbortSignal): AsyncIterable<string>;

  /** Devuelve un vector por texto, en el mismo orden. */
  embed(request: EmbedRequest): Promise<number[][]>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');

/* ------------------------------------------------------------- errores --- */

/**
 * Errores del proveedor, traducidos a categorias que el servicio entiende.
 *
 * Se distinguen porque el usuario ve cosas distintas: una cuota agotada es
 * temporal y se puede explicar con honestidad ("vuelve en unos minutos"),
 * mientras que una clave ausente es un fallo de configuracion del sitio y no
 * hay nada que el visitante pueda hacer.
 */
export type AiErrorKind = 'not_configured' | 'quota' | 'upstream' | 'aborted';

export class AiError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
    /** Segundos que el proveedor pide esperar, si los dice. */
    readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'AiError';
  }
}
