import { normalizeForRules } from './injection';

/**
 * ============================================================================
 * FILTRO DE CONTENIDO
 * ============================================================================
 * Se aplica a la ENTRADA y a la SALIDA. A la entrada para no gastar cuota ni
 * mandarle basura al modelo; a la salida porque un modelo puede desbarrar
 * aunque la pregunta fuera inocente.
 *
 * EL RIESGO PROPIO DE ESTE SITIO no es el genérico de un chatbot. Son cuatro
 * mujeres reales con nombre y apellidos, sobre las que circula a diario
 * sexualizacion, acoso y especulacion sobre su vida privada. Por eso hay una
 * categoria entera -`private-life`- que no aparece en ningun filtro estandar:
 * preguntar con quien sale alguien no es odio ni es sexual, y es exactamente
 * lo que este sitio no va a contestar.
 *
 * OJO CON LOS FALSOS POSITIVOS, QUE AQUI SON ESPECIALMENTE FACILES.
 * El catalogo se llama "Kill This Love", "Pink Venom", "Shut Down",
 * "Love To Hate Me" y "Playing with Fire". Un filtro de violencia u odio hecho
 * a base de palabras sueltas bloquea media discografia. Por eso:
 *
 *   - Los patrones exigen contexto, no palabras aisladas.
 *   - Hay una lista explicita de titulos del catalogo que nunca disparan.
 *   - Y un test que lo comprueba, porque esto se rompe en cuanto alguien
 *     "mejora" un patron.
 * ============================================================================
 */

export type ModerationCategory = 'sexual' | 'hate' | 'harassment' | 'private-life';

export interface ModerationRule {
  id: string;
  category: ModerationCategory;
  pattern: RegExp;
}

/**
 * Titulos y expresiones del catalogo que contienen palabras "duras".
 *
 * Se retiran del texto ANTES de aplicar los patrones. No se anaden como
 * excepcion a cada regla: eso obligaria a acordarse de ellos en cada patron
 * nuevo, y nadie se acuerda.
 */
const CATALOG_SAFE = [
  'kill this love',
  'love to hate me',
  'playing with fire',
  'pink venom',
  'shut down',
  'hard to love',
  'typa girl',
  'boombayah',
  'ddu-du ddu-du',
  'bet you wanna',
  'crazy over you',
  'the happiest girl',
  'lovesick girls',
  'pretty savage',
  'rockstar',
  'as if it its your last',
];

export const MODERATION_RULES: ModerationRule[] = [
  {
    id: 'sexual-explicit',
    category: 'sexual',
    pattern:
      /\b(desnud\w*|porno\w*|sexual\w*|sexo|erotic\w*|nude|naked|nsfw|onlyfans|fetich\w*|masturb\w*|deepfake)\b/i,
  },
  {
    id: 'sexualizing-members',
    category: 'sexual',
    pattern:
      /\b(cuerpo|figura|curvas|pechos|trasero|piernas|body|boobs|ass|hot|sexy)\b[\s\S]{0,40}\b(jennie|jisoo|rose|rosé|lisa|blackpink|integrante|member)\b|\b(jennie|jisoo|rose|rosé|lisa)\b[\s\S]{0,25}\b(desnud\w*|sexy|hot|cuerpo)\b/i,
  },
  {
    id: 'hate-speech',
    category: 'hate',
    pattern:
      /\b(odio\s*a\s*(los|las)|deberian\s*(morir|desaparecer)|should\s*die|inferior(es)?\s*(por|because)|raza\s*inferior|subhuman|go\s*back\s*to\s*your\s*country|todos\s*los\s*\w+\s*son\s*(unos|unas)?\s*\w*)\b/i,
  },
  {
    id: 'harassment',
    category: 'harassment',
    pattern:
      /\b(insult\w*\s*a|escribe\s*(un|algo)\s*(insulto|amenaza)|amenaz\w*\s*(a|de\s*muerte)|acos\w*\s*a|humill\w*\s*a|write\s*(an?\s*)?(insult|threat)|kill\s*(yourself|jennie|jisoo|rose|lisa)|matate|dile\s*a\s*\w+\s*que\s*se\s*muera)\b/i,
  },
  {
    id: 'private-life',
    category: 'private-life',
    pattern:
      /\b(novi[oa]s?|pareja\s*(de|actual)|con\s*quien\s*sale|esta\s*saliendo\s*con|dating|boyfriend|girlfriend|relacion\s*(amorosa|sentimental)|ruptura|se\s*acost\w*|embarazad\w*|cirugia\s*(estetica|plastica)|plastic\s*surgery|adelgaz\w*|peso\s*(actual|real)|trastorno\s*aliment\w*|salud\s*mental\s*de|depresion\s*de|cuanto\s*(gana|cobra)|cuanto\s*dinero|patrimonio|net\s*worth)\b|열애설?|결혼설/i,
  },
];

export interface ModerationVerdict {
  blocked: boolean;
  category: ModerationCategory | null;
  ruleId: string | null;
}

const CLEAN: ModerationVerdict = { blocked: false, category: null, ruleId: null };

/**
 * Revisa un texto, sea del visitante o del modelo.
 *
 * Primero se retiran los titulos del catalogo y despues se aplican los
 * patrones: el orden importa, porque "Kill This Love" desaparece antes de que
 * la regla de acoso vea la palabra "kill".
 */
export function moderate(text: string): ModerationVerdict {
  let normalized = normalizeForRules(text);

  for (const title of CATALOG_SAFE) {
    normalized = normalized.split(title).join(' [titulo] ');
  }

  const hit = MODERATION_RULES.find((rule) => rule.pattern.test(normalized));
  return hit ? { blocked: true, category: hit.category, ruleId: hit.id } : CLEAN;
}
