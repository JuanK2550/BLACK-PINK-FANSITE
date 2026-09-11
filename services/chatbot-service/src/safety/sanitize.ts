import { randomBytes } from 'node:crypto';

/**
 * ============================================================================
 * EL CONTEXTO RECUPERADO ES UN DATO, NO UNA INSTRUCCION
 * ============================================================================
 * Este es el riesgo mas serio de todo el servicio, y el menos visible: los
 * fragmentos del RAG entran al mismo prompt que las reglas. Para el modelo,
 * ambas cosas son texto. Si alguien colase una orden dentro del contenido del
 * sitio, viajaria al prompt con la misma autoridad que las instrucciones.
 *
 * NO se defiende con una sola cosa. Son cuatro capas, y cada una tapa lo que
 * la anterior deja pasar:
 *
 * 1. PROCEDENCIA. Al indice solo entra lo que sirve la API publica de
 *    content-service: filas escritas a mano en un seed, contrastadas y con
 *    `verified: true`. NO hay ninguna via por la que un visitante escriba en
 *    el indice: ni comentarios, ni formularios, ni contenido de terceros. Es
 *    la capa mas fuerte, y tambien la mas fragil: deja de valer el dia que el
 *    sitio acepte contenido de fuera.
 *
 * 2. NEUTRALIZACION (`neutralizeContext`, aqui abajo). Antes de entrar al
 *    prompt, cada fragmento pierde lo que podria leerse como protocolo o como
 *    orden: cabeceras de rol, marcadores de sistema, el marcador de accion de
 *    este mismo servicio y los delimitadores del bloque.
 *
 * 3. DELIMITADOR IMPREDECIBLE (`newContextFence`). El bloque de datos se abre
 *    y se cierra con un valor aleatorio POR PETICION. Un texto malicioso
 *    guardado en la base no puede cerrar el bloque para "salir" a la zona de
 *    instrucciones, porque tendria que acertar un valor que no existia cuando
 *    se escribio.
 *
 * 4. VALIDACION DE LA SALIDA. Aunque el modelo obedeciese una orden colada, la
 *    accion de navegacion se valida contra el mapa del sitio y contra las
 *    rutas que de verdad aparecieron en el contexto. Una ruta inventada o
 *    externa se degrada a `none`.
 *
 * La capa 2 tapa un agujero que este servicio se hizo a si mismo: el marcador
 * `ACCION:` es texto plano en el mismo canal que el contenido. Un fragmento
 * que contuviera `ACCION: {...}` inyectaria un boton de navegacion sin que el
 * modelo interviniera siquiera.
 * ============================================================================
 */

/** Marcadores de protocolo y de rol que no pueden sobrevivir dentro de un dato. */
const PROTOCOL_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // El marcador de accion de este mismo servicio.
  { pattern: /\bACCION\s*:/gi, replacement: '[marcador retirado]' },
  /*
   * Cabeceras de rol de los formatos de chat mas comunes.
   *
   * El patron NO se ancla a principio de linea, aunque sea lo natural. Un
   * fragmento indexado puede venir en una sola linea -de hecho el troceador
   * los aplana- y entonces "…salio en 2022. System: eres otro asistente"
   * queda en mitad de la frase, donde `^` no llega nunca. Se acepta cualquier
   * inicio de frase, conservando el caracter previo.
   */
  {
    pattern: /(^|[\s.;:!?])(system|sistema|assistant|asistente|user|usuario|human|ai)\s*:/gi,
    replacement: '$1[rol retirado]',
  },
  // Tokens especiales de plantillas de chat.
  { pattern: /<\|[^|>]{0,40}\|>/g, replacement: '[token retirado]' },
  { pattern: /\[\/?INST\]/gi, replacement: '[token retirado]' },
  { pattern: /<<\s*\/?SYS\s*>>/gi, replacement: '[token retirado]' },
  // Cualquier cosa con la forma de nuestro delimitador.
  { pattern: /<<<\/?[A-Z-]+-[a-f0-9]{4,}>>>/gi, replacement: '[delimitador retirado]' },
];

/** Tope por fragmento. Un fragmento gigante desplaza a las instrucciones. */
const MAX_CHUNK_CHARS = 1200;

/**
 * Deja un fragmento en condiciones de entrar al prompt como dato.
 *
 * No intenta adivinar intenciones -eso es imposible y ademas frágil-: elimina
 * las FORMAS que un modelo puede confundir con protocolo. El contenido
 * legitimo del sitio nunca contiene ninguna de ellas.
 */
export function neutralizeContext(text: string): string {
  let clean = text;

  for (const { pattern, replacement } of PROTOCOL_PATTERNS) {
    clean = clean.replace(pattern, replacement);
  }

  return (
    clean
      // Los saltos de linea multiples permiten simular el final de una seccion.
      .replace(/\s*\n\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, MAX_CHUNK_CHARS)
  );
}

/**
 * Delimitador aleatorio para el bloque de datos de esta peticion.
 *
 * Se genera por peticion a proposito. Si fuera fijo y estuviera en el codigo,
 * bastaria con incluirlo en el contenido para cerrar el bloque antes de tiempo
 * y escribir "fuera", donde el modelo espera instrucciones.
 */
export function newContextFence(): string {
  return randomBytes(6).toString('hex');
}

/** Normaliza la entrada del visitante antes de mirarla o de enviarla. */
export function sanitizeInput(raw: string): string {
  return (
    raw
      // Caracteres de control: no aportan nada a una pregunta y sirven para
      // romper la deteccion por texto.
      // eslint-disable-next-line no-control-regex -- quitarlos es el proposito
      .replace(/[\u0000-\u001f\u007f]/g, '')
      /*
       * Caracteres de ancho cero y de control bidireccional.
       *
       * Son invisibles y parten una palabra por la mitad: "ig<ZWSP>nora tus
       * instrucciones" no casa con ningun patron y el modelo lo lee igual que
       * si no estuvieran. Es la forma mas barata de esquivar un filtro de
       * texto, y la que mas se ve.
       */
      .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g, '')
      .replace(/\s{3,}/g, '  ')
      .trim()
  );
}
