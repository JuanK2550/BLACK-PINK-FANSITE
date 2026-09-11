import type { ReactNode } from 'react';

/**
 * Formas de datos que consume la navegacion.
 *
 * Los componentes de packages/ui no saben de donde vienen los datos: en la
 * Fase 2 se los pasa apps/web desde archivos locales de prueba, y a partir de
 * la Fase 4 se los pasara el api-gateway sin tocar un solo componente.
 */

/** Panel que despliega un elemento de navegacion, si despliega alguno. */
export type NavPanel = 'members' | 'albums';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  /** Descripcion corta para el menu movil y el buscador. */
  hint?: string;
  panel?: NavPanel;
}

export interface MemberSummary {
  slug: string;
  /** Nombre artistico, tal y como se muestra. */
  name: string;
  /** Nombre en hangul. Se marca con lang="ko" alli donde se pinta. */
  nameKo: string;
  role: string;
  href: string;
  /** Letra grande del marco de imagen mientras no haya foto. */
  glyph: string;
  /**
   * La foto YA MONTADA, si la hay.
   *
   * Se pasa como nodo y no como una URL a proposito: `packages/ui` no conoce
   * Next, y optimizar una imagen es cosa de `next/image`. Con una URL, este
   * paquete tendria que pintar un `<img>` pelado y descargaria el archivo
   * entero -960px- para una miniatura de cien. Con un nodo, quien sabe de
   * imagenes las monta y aqui solo se coloca.
   */
  photo?: ReactNode;
}

export interface AlbumSummary {
  slug: string;
  title: string;
  /** Ano de publicacion. Se pinta con cifras tabulares. */
  year: number;
  /** Sencillo, EP, album de estudio... */
  format: string;
  href: string;
  /**
   * La portada YA MONTADA, si la hay.
   *
   * Mismo trato que `photo` en `MemberSummary`, y por el mismo motivo: este
   * paquete no conoce Next y no puede montar un `next/image`. Con un nodo,
   * quien sabe de imagenes la monta y aqui solo se coloca.
   *
   * Este campo faltaba y por eso el mega-menu seguia pintando el marco de
   * relleno cuando el resto del sitio ya mostraba portadas.
   */
  cover?: ReactNode;
}

export interface SearchEntry {
  id: string;
  title: string;
  /** Seccion a la que pertenece: agrupa los resultados. */
  section: string;
  href: string;
  /** Terminos alternativos que tambien deben encontrar esta entrada. */
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
