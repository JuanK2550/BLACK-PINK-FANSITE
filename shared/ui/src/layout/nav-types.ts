// Tipos de los datos de navegación.

import type { ReactNode } from 'react';

export type NavPanel = 'members' | 'albums';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  hint?: string;
  panel?: NavPanel;
}

export interface MemberSummary {
  slug: string;
  name: string;
  nameKo: string;
  role: string;
  href: string;
  glyph: string;
  photo?: ReactNode;
}

export interface AlbumSummary {
  slug: string;
  title: string;
  year: number;
  format: string;
  href: string;
  cover?: ReactNode;
}

export interface SearchEntry {
  id: string;
  title: string;
  section: string;
  href: string;
  keywords?: string[];
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}
