/**
 * ============================================================================
 * INTENTOS DE INYECCION
 * ============================================================================
 * QUE ES ESTO Y QUE NO ES.
 *
 * Esto NO es "la defensa" contra la inyeccion de prompt. Una lista de patrones
 * siempre se puede rodear, y prometer lo contrario seria mentir. La defensa de
 * verdad son cuatro cosas que no dependen de adivinar el texto:
 *
 *   - El system prompt, que acota identidad y alcance.
 *   - Que no haya nada que robar: el servicio no guarda secretos en el
 *     contexto del modelo mas alla del propio prompt.
 *   - La separacion estructural entre datos e instrucciones (`sanitize.ts`).
 *   - La validacion de la accion contra el mapa del sitio.
 *
 * Lo que SI aporta esta capa, y por eso existe:
 *
 *   1. Corta lo evidente ANTES de gastar cuota. Un "ignora tus instrucciones"
 *      no merece una llamada a Gemini.
 *   2. Da un registro de auditoria con nombre de regla, que es lo unico que
 *      permite enterarse de que alguien esta probando.
 *   3. Responde igual siempre, sin depender de si el modelo tuvo un buen dia.
 *
 * SE PREFIERE DEJAR PASAR ANTES QUE BLOQUEAR DE MAS. Un falso positivo le
 * niega una respuesta a un fan que preguntaba bien, y eso se nota mas que un
 * intento de inyeccion que acaba topandose con el system prompt igualmente.
 * ============================================================================
 */

export interface InjectionRule {
  /** Identificador estable. Es lo que va al log de auditoria. */
  id: string;
  /** Que vector cubre, para quien lea el log dentro de seis meses. */
  vector: string;
  pattern: RegExp;
}

/**
 * Las reglas se escriben sobre el texto NORMALIZADO: sin acentos, en
 * minusculas y con los espacios colapsados. Asi "IGNORA" e "ignóra" son lo
 * mismo y no hacen falta tres variantes de cada patron.
 */
export const INJECTION_RULES: InjectionRule[] = [
  {
    id: 'reveal-system-prompt',
    vector: 'Pedir el system prompt directamente',
    pattern:
      /\b(system\s*prompt|prompt\s*del?\s*sistema|instrucciones\s*(de|del)\s*sistema|tus\s*instrucciones|tu\s*prompt|your\s*(system\s*)?(instructions|prompt)|initial\s*prompt)\b|시스템\s*프롬프트|프롬프트를?\s*(알려|보여)/i,
  },
  {
    id: 'reveal-as-debug',
    vector: 'Pedirlo disfrazado de depuracion o de mantenimiento',
    pattern:
      /\b(debug|depuraci?on|diagnostic\w*|modo\s*(debug|desarrollo|mantenimiento)|verbose\s*mode|dump)\b[\s\S]{0,60}\b(prompt|config\w*|instruc\w*|reglas|rules|settings)\b/i,
  },
  {
    id: 'role-override',
    vector: 'Cambio de rol o de personaje',
    pattern:
      /\b(ahora\s*eres|a\s*partir\s*de\s*ahora\s*eres|you\s*are\s*now|act\s*as\s*(if|an?)|actua\s*como|pretend\s*(to\s*be|you)|olvida\s*(que\s*eres|tu\s*rol)|forget\s*(you\s*are|your\s*role)|sin\s*(restricciones|filtros|limites)|no\s*restrictions|jailbreak|\bDAN\b|developer\s*mode)\b/i,
  },
  {
    id: 'ignore-instructions',
    vector: 'Anular instrucciones previas, en cualquier idioma',
    pattern:
      /\b(ignor\w*|olvid\w*|desestima\w*|disregard|forget|override|bypass|skip)\b[\s\S]{0,40}\b(instruc\w*|reglas|rules|prompt|anterior\w*|previous|above|prior|directri\w*)\b|지시\S*\s*무시|이전\S*\s*무시|명령\S*\s*무시/i,
  },
  {
    id: 'fake-system-turn',
    vector: 'Continuacion fingida: simular un turno del sistema',
    pattern:
      /(^|\n)\s*(system|sistema|assistant|asistente)\s*[:>]|<\|[^|>]{0,40}\|>|\[\/?INST\]|<<\s*\/?SYS\s*>>|###\s*(system|instruction)/i,
  },
  {
    id: 'false-authority',
    vector: 'Falsa autoridad: hacerse pasar por quien manda',
    pattern:
      /\b(soy\s*(el|la|tu)?\s*(desarrollador\w*|programador\w*|administrador\w*|creador\w*|dueno|ingeniero)|i\s*am\s*(the|your)\s*(developer|admin\w*|creator|engineer)|as\s*your\s*(developer|admin\w*)|autorizo\s*que|te\s*autorizo|permiso\s*especial)\b|개발자\S*\s*(입니다|이고|예요)/i,
  },
  {
    id: 'encoded-payload',
    vector: 'Carga codificada (base64, rot13, hex)',
    pattern:
      /\b(base\s*64|rot\s*13|decodifica\w*|decode|descifra\w*|en\s*hexadecimal|hex\s*decode)\b|\b[A-Za-z0-9+/]{40,}={0,2}\b/i,
  },
  {
    id: 'env-and-secrets',
    vector: 'Pedir variables de entorno, claves o arquitectura interna',
    pattern:
      /\b(variables?\s*de\s*entorno|env\s*vars?|process\.env|\.env\b|api[\s_-]*key|clave\s*(de\s*)?api|token\s*de\s*acceso|credencial\w*|secret\w*|GOOGLE_AI\w*|que\s*modelo\s*(usas|eres)|which\s*model\s*are\s*you)\b/i,
  },
  {
    id: 'private-data-pretext',
    vector: 'Datos privados con una excusa creible',
    pattern:
      /\b(direcci?on|domicilio|telefono|movil|numero\s*de\s*contacto|correo\s*(electronico|personal)|email\s*personal|donde\s*vive|donde\s*esta\s*ahora|ubicaci?on\s*(actual|en\s*tiempo\s*real)|address|phone\s*number|home\s*address|where\s*(does\s*\w+\s*live|is\s*\w+\s*right\s*now))\b|주소|전화번호/i,
  },
  {
    id: 'output-smuggling',
    vector: 'Colar protocolo o enlaces en la respuesta',
    pattern:
      /\b(accion\s*:|responde\s*(solo\s*)?con\s*json|termina\s*(tu\s*respuesta\s*)?con|incluye\s*(este\s*)?enlace|output\s*exactly|repite\s*(exactamente|literalmente)|repeat\s*(the\s*)?(text|words)\s*above)\b/i,
  },
];

export interface InjectionVerdict {
  blocked: boolean;
  /** Reglas que dispararon. Vacio si no hubo ninguna. */
  rules: string[];
}

/** Quita acentos y baja a minusculas para que un patron cubra sus variantes. */
export function normalizeForRules(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      /*
       * RECOMPONER ES OBLIGATORIO, y es un fallo que costo encontrar.
       *
       * NFD no solo separa los acentos latinos: DESCOMPONE LAS SILABAS
       * HANGUL en jamo. Asi, 시 deja de ser 시 y ningun patron escrito en
       * coreano vuelve a casar nunca. El resultado es que las reglas parecian
       * funcionar -en castellano y en ingles- mientras el coreano pasaba
       * entero sin filtrar.
       */
      .normalize('NFC')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Revisa el mensaje del visitante.
 *
 * Devuelve TODAS las reglas que casan, no solo la primera: al leer el log
 * importa distinguir un roce con un patron de un intento que dispara cuatro.
 */
export function detectInjection(message: string): InjectionVerdict {
  const normalized = normalizeForRules(message);
  const rules = INJECTION_RULES.filter((rule) => rule.pattern.test(normalized)).map((r) => r.id);

  return { blocked: rules.length > 0, rules };
}
