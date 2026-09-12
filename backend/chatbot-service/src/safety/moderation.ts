// Filtra peticiones de datos personales y contenido no permitido.

import { normalizeForRules } from './injection';

export type ModerationCategory = 'sexual' | 'hate' | 'harassment' | 'private-life';

export interface ModerationRule {
  id: string;
  category: ModerationCategory;
  pattern: RegExp;
}

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

export function moderate(text: string): ModerationVerdict {
  let normalized = normalizeForRules(text);

  for (const title of CATALOG_SAFE) {
    normalized = normalized.split(title).join(' [titulo] ');
  }

  const hit = MODERATION_RULES.find((rule) => rule.pattern.test(normalized));
  return hit ? { blocked: true, category: hit.category, ruleId: hit.id } : CLEAN;
}
