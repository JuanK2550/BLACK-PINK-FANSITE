import type { Metadata } from 'next';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type AlbumDetail,
  type Locale,
  type MemberDetail,
} from '@blackpink/types';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

const SITE_NAME = 'BLACKPINK Fansite';

/**
 * ============================================================================
 * METADATOS Y DATOS ESTRUCTURADOS
 * ============================================================================
 * Dos reglas que no se saltan en ninguna página:
 *
 * 1. NUNCA se declara al sitio como oficial. El JSON-LD usa `WebPage` con
 *    `isPartOf` apuntando a este sitio de fans, y las entidades del grupo van
 *    como `about`, no como `publisher`. Marcar el sitio como la entidad
 *    "BLACKPINK" le diría a Google que ESTE es el sitio del grupo, que es
 *    exactamente lo que el aviso legal niega en cada página.
 *
 * 2. Ninguna descripción inventa datos. Salen del contenido real que ya se
 *    está mostrando.
 * ============================================================================
 */

export interface PageSeoOptions {
  title: string;
  description: string;
  /** Ruta SIN el prefijo de idioma, empezando por /. */
  path: string;
  locale: Locale;
}

/** Etiquetas de Open Graph, que usan guion bajo y region. */
const OG_LOCALES: Record<Locale, string> = {
  es: 'es_ES',
  en: 'en_US',
  ko: 'ko_KR',
};

export function buildMetadata({ title, description, path, locale }: PageSeoOptions): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;

  return {
    title,
    description,
    /*
     * hreflang por pagina. El canonical apunta a ESTA version, y `languages`
     * lista las otras dos: asi un buscador entiende que son la misma pagina en
     * tres idiomas y no tres paginas compitiendo por la misma consulta.
     */
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(
          SUPPORTED_LOCALES.map((code) => [code, `${SITE_URL}/${code}${path}`]),
        ),
        'x-default': `${SITE_URL}/${DEFAULT_LOCALE}${path}`,
      },
    },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      locale: OG_LOCALES[locale],
      // Las otras versiones, para que una red social pueda ofrecerlas.
      alternateLocale: SUPPORTED_LOCALES.filter((code) => code !== locale).map(
        (code) => OG_LOCALES[code],
      ),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

/** Migas de pan. Ayudan a Google a entender la jerarquía del sitio. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      // La miga apunta a la version en el idioma que se esta viendo: enviar a
      // alguien de la ficha coreana al indice en espanol seria un salto de
      // idioma a mitad de navegacion.
      item: `${SITE_URL}/${locale}${step.path === '/' ? '' : step.path}`,
    })),
  };
}

/**
 * Ficha de integrante.
 *
 * Se publica solo lo que la API devuelve; si un campo no está, no aparece en
 * el marcado. Rellenar un hueco de datos estructurados con una suposición es
 * exactamente el tipo de invención que este proyecto no hace.
 */
export function personJsonLd(member: MemberDetail, path: string, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.stageName,
    alternateName: [member.fullName, member.koreanName].filter(Boolean),
    url: `${SITE_URL}/${locale}${path}`,
    ...(member.birthDate ? { birthDate: member.birthDate } : {}),
    ...(member.nationality ? { nationality: member.nationality } : {}),
    jobTitle: member.position,
    memberOf: { '@type': 'MusicGroup', name: 'BLACKPINK' },
    ...(member.bio ? { description: member.bio } : {}),
    ...(member.socials && Object.keys(member.socials).length > 0
      ? { sameAs: Object.values(member.socials) }
      : {}),
  };
}

/** Ficha de álbum, con sus canciones. */
export function albumJsonLd(album: AlbumDetail, path: string, locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album.title,
    url: `${SITE_URL}/${locale}${path}`,
    datePublished: album.releaseDate,
    byArtist: { '@type': 'MusicGroup', name: 'BLACKPINK' },
    ...(album.label ? { recordLabel: { '@type': 'Organization', name: album.label } } : {}),
    numTracks: album.trackCount,
    track: album.tracks.map((track) => ({
      '@type': 'MusicRecording',
      name: track.title,
      position: track.trackNumber,
      ...(track.durationSec ? { duration: `PT${track.durationSec}S` } : {}),
    })),
  };
}

/**
 * Página del sitio. El `isPartOf` deja claro de quién es la página: de este
 * sitio de fans, no del grupo.
 */
export function webPageJsonLd(options: {
  name: string;
  description: string;
  path: string;
  locale: Locale;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: options.name,
    description: options.description,
    url: `${SITE_URL}/${options.locale}${options.path}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description:
        'Sitio de fans no oficial sobre BLACKPINK. No afiliado a YG Entertainment ni a BLACKPINK.',
    },
    about: { '@type': 'MusicGroup', name: 'BLACKPINK' },
  };
}
