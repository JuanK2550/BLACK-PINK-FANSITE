import type { SocialLink } from '@blackpink/ui';

/**
 * Enlaces OFICIALES del grupo.
 *
 * Van aqui y no en el sistema de traducciones porque no son texto de interfaz:
 * son destinos, iguales en los tres idiomas. Traducirlos no tendria sentido y
 * abriria la puerta a que una version se quedara con una URL vieja.
 *
 * La navegacion del sitio ya NO vive en este archivo: sus etiquetas son texto
 * visible, asi que se construyen desde `messages/{es,en,ko}.json` alli donde se
 * usan (site-chrome, hero, not-found).
 */
export const OFFICIAL_LINKS: SocialLink[] = [
  { label: 'YouTube', href: 'https://www.youtube.com/@BLACKPINK' },
  { label: 'Instagram', href: 'https://www.instagram.com/blackpinkofficial' },
  { label: 'X', href: 'https://x.com/BLACKPINK' },
  { label: 'blackpinkofficial.com', href: 'https://www.blackpinkofficial.com' },
];
