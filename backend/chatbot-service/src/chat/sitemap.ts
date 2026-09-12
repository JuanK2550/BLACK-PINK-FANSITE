// Páginas a las que PINKY puede llevar al visitante.

import type { Locale } from '@blackpink/types';

export type ChatActionType = 'navigate' | 'open_section' | 'none';

export interface ChatAction {
  action: ChatActionType;
  path: string | null;
  label: string | null;
}

export const NO_ACTION: ChatAction = { action: 'none', path: null, label: null };

interface Section {
  path: string;
  labels: Record<Locale, string>;
  describes: string;
}

export const SECTIONS: Section[] = [
  {
    path: '/grupo',
    labels: { es: 'Ir a Grupo', en: 'Go to Group', ko: '그룹 페이지로' },
    describes: 'presentacion del grupo',
  },
  {
    path: '/integrantes',
    labels: { es: 'Ver integrantes', en: 'See members', ko: '멤버 보기' },
    describes: 'las cuatro integrantes',
  },
  {
    path: '/discografia',
    labels: { es: 'Ver discografia', en: 'See discography', ko: '디스코그래피 보기' },
    describes: 'albumes y canciones',
  },
  {
    path: '/cronologia',
    labels: { es: 'Ver cronologia', en: 'See timeline', ko: '연표 보기' },
    describes: 'hitos desde el debut',
  },
  {
    path: '/curiosidades',
    labels: { es: 'Ver curiosidades', en: 'See fun facts', ko: '비하인드 보기' },
    describes: 'curiosidades y records',
  },
  {
    path: '/premios',
    labels: { es: 'Ver premios', en: 'See awards', ko: '수상 보기' },
    describes: 'palmares de premios y nominaciones',
  },
  {
    path: '/playlists',
    labels: { es: 'Ver playlists', en: 'See playlists', ko: '플레이리스트 보기' },
    describes: 'selecciones de canciones',
  },
  {
    path: '/galeria',
    labels: { es: 'Ver galeria', en: 'See gallery', ko: '갤러리 보기' },
    describes: 'fotografias del grupo y de cada integrante',
  },
  {
    path: '/quiz',
    labels: { es: 'Jugar al quiz', en: 'Play the quiz', ko: '퀴즈 하기' },
    describes: 'quiz de preguntas sobre el grupo',
  },
  {
    path: '/integrantes/comparar',
    labels: { es: 'Comparar integrantes', en: 'Compare members', ko: '멤버 비교하기' },
    describes: 'comparar dos integrantes lado a lado',
  },
];

export function describeSitemap(): string {
  return SECTIONS.map((section) => `${section.path} — ${section.describes}`).join('\n');
}

export function localizePath(path: string, locale: Locale): string {
  return `/${locale}${path}`;
}

export interface KnownTarget {
  path: string;
  label: string;
}

export function resolveAction(
  raw: { action?: string; path?: string } | null,
  locale: Locale,
  known: KnownTarget[],
): ChatAction {
  if (!raw || !raw.action || raw.action === 'none' || !raw.path) return NO_ACTION;
  if (raw.action !== 'navigate' && raw.action !== 'open_section') return NO_ACTION;

  const path = raw.path.startsWith('/') ? raw.path : `/${raw.path}`;

  const bare = path.replace(/^\/(es|en|ko)(?=\/|$)/, '');

  const section = SECTIONS.find((entry) => entry.path === bare);
  if (section) {
    return {
      action: raw.action,
      path: localizePath(section.path, locale),
      label: section.labels[locale],
    };
  }

  const target = known.find((entry) => entry.path === bare);
  if (target) {
    return {
      action: raw.action,
      path: localizePath(bare, locale),
      label: target.label,
    };
  }

  return NO_ACTION;
}
