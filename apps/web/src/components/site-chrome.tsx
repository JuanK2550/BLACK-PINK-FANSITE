'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { AlbumSummary, Locale, MemberSummary } from '@blackpink/types';
import { AlbumCover } from './album-cover';
import { MemberPhoto } from './member-photo';
import { DisclaimerBanner, SiteFooter, SiteHeader, SkipLink } from '@blackpink/ui';
import type { FooterColumn, NavItem, SearchEntry } from '@blackpink/ui';
import { OFFICIAL_LINKS } from '../data/site';
import { usePathname, useRouter } from '../i18n/routing';

export interface SiteChromeProps {
  children: ReactNode;
  members: MemberSummary[];
  albums: AlbumSummary[];
}

/**
 * Envoltorio común a todas las páginas: aviso legal, header, contenido y pie.
 *
 * La navegación se construye aquí a partir de las traducciones, no de un
 * archivo de datos: las etiquetas son texto de interfaz y viven donde vive
 * todo el texto de interfaz.
 */
export function SiteChrome({ children, members, albums }: SiteChromeProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const nav = useTranslations('Nav');
  const header = useTranslations('Header');
  const footer = useTranslations('Footer');
  const search = useTranslations('Search');
  const a11y = useTranslations('A11y');

  const [query, setQuery] = useState('');

  const items = useMemo<NavItem[]>(
    () => [
      { key: 'grupo', label: nav('grupo'), href: '/grupo' },
      { key: 'integrantes', label: nav('integrantes'), href: '/integrantes', panel: 'members' },
      { key: 'discografia', label: nav('discografia'), href: '/discografia', panel: 'albums' },
      { key: 'cronologia', label: nav('cronologia'), href: '/cronologia' },
      { key: 'curiosidades', label: nav('curiosidades'), href: '/curiosidades' },
      { key: 'playlists', label: nav('playlists'), href: '/playlists' },
      { key: 'premios', label: nav('premios'), href: '/premios' },
      { key: 'galeria', label: nav('galeria'), href: '/galeria' },
      { key: 'quiz', label: nav('quiz'), href: '/quiz' },
    ],
    [nav],
  );

  const footerColumns = useMemo<FooterColumn[]>(
    () => [
      {
        title: footer('explore'),
        links: [
          { label: nav('integrantes'), href: '/integrantes' },
          { label: nav('discografia'), href: '/discografia' },
          { label: nav('cronologia'), href: '/cronologia' },
        ],
      },
      {
        title: footer('project'),
        links: [
          { label: nav('curiosidades'), href: '/curiosidades' },
          { label: nav('galeria'), href: '/galeria' },
          { label: nav('quiz'), href: '/quiz' },
          // Los creditos van en el pie y no escondidos: la atribucion de las
          // fotos es la condicion de su licencia, y una condicion que hay que
          // buscar no esta cumplida.
          { label: nav('creditos'), href: '/creditos' },
        ],
      },
    ],
    [footer, nav],
  );

  /*
   * BÚSQUEDA REMOTA. `enabled` corta las consultas de menos de dos caracteres,
   * que es el mínimo que exige la API. `placeholderData` conserva los
   * resultados anteriores mientras llega la respuesta siguiente, para que el
   * panel no parpadee en cada tecla.
   */
  const trimmed = query.trim();

  const { data, isFetching } = useQuery({
    queryKey: ['search', trimmed, locale],
    queryFn: async ({ signal }) => {
      const { search: runSearch } = await import('../lib/api');
      return runSearch(trimmed, { locale, limit: 5 }, { signal });
    },
    enabled: trimmed.length >= 2,
    placeholderData: (previous) => previous,
  });

  const entries = useMemo<SearchEntry[]>(() => {
    if (!data) return [];

    const sections: Record<string, string> = {
      member: nav('integrantes'),
      album: nav('discografia'),
      track: nav('discografia'),
      timeline: nav('cronologia'),
    };

    return [...data.members, ...data.albums, ...data.tracks, ...data.timeline].map((hit) => ({
      id: `${hit.type}-${hit.id}`,
      title: hit.title,
      section: sections[hit.type] ?? nav('grupo'),
      href: hit.href,
    }));
  }, [data, nav]);

  /**
   * Cambiar de idioma navega a la MISMA página en el otro idioma, no al
   * inicio. Quien está leyendo la ficha de Jisoo en español y pulsa KO espera
   * seguir en la ficha de Jisoo, no volver a empezar.
   *
   * Va en una transición para que la interfaz siga respondiendo mientras el
   * servidor prepara la página nueva.
   */
  function changeLocale(next: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <>
      <SkipLink href="#contenido">{a11y('skip')}</SkipLink>
      <DisclaimerBanner locale={locale} />

      <SiteHeader
        items={items}
        members={members.map((member) => ({
          slug: member.slug,
          name: member.stageName,
          nameKo: member.koreanName ?? '',
          role: member.position,
          href: `/integrantes/${member.slug}`,
          glyph: member.stageName.charAt(0),
          /*
           * SIN CREDITO VISIBLE, y es la unica excepcion del sitio.
           *
           * Estas miniaturas miden poco mas de cien pixeles: una linea de
           * credito ahi no se lee, y ademas taparia media foto. La propia CC
           * BY admite acreditar «de forma razonable segun el medio», y para un
           * menu la forma razonable es el enlace a /creditos que hay al pie
           * del propio panel. La atribucion sigue estando a un clic, visible y
           * completa, que es lo que pide la licencia.
           */
          photo: (
            <MemberPhoto
              member={member}
              zoom
              hideCredit
              /* 256 y no 180: el hueco del panel mide 244px y con 180 Next
                 servia una variante mas pequena que el hueco, asi que la foto
                 salia ampliada y blanda. Medido en pantalla. */
              sizes="(max-width: 768px) 44vw, 256px"
            />
          ),
        }))}
        albums={albums.map((album) => ({
          slug: album.slug,
          title: album.title,
          year: album.year,
          format: album.formatLabel ?? album.type,
          href: `/discografia/${album.slug}`,
          /*
           * La portada, montada aqui igual que la foto de arriba.
           *
           * Este mapeo se escribio antes de que hubiera portadas y se quedo
           * con cinco campos: los datos llegaban enteros desde la API y se
           * perdian en esta linea. El sitio mostraba portadas en todas partes
           * menos aqui.
           *
           * Sin credito: no es una foto con licencia CC, es la portada que
           * sirve Spotify. No hay nada que atribuir junto a la miniatura.
           */
          cover: (
            <AlbumCover
              cover={album}
              title={album.title}
              alt={a11y('coverAlt', { title: album.title })}
              /* Hueco de 56px: la variante pequena de Spotify, no la de 640. */
              variant="thumb"
              glyph={String(album.year).slice(2)}
              sizes="56px"
              className="w-14 shrink-0"
            />
          ),
        }))}
        searchEntries={entries}
        searchRemote
        searchLoading={isFetching}
        onSearchQueryChange={setQuery}
        locale={locale}
        onLocaleChange={changeLocale}
        localePrefix={`/${locale}`}
        labels={{
          home: header('home'),
          primaryNav: header('primaryNav'),
          openMenu: header('openMenu'),
          closeMenu: header('closeMenu'),
          menuTitle: header('menuTitle'),
          search: header('search'),
          language: header('language'),
          toLight: header('toLight'),
          toDark: header('toDark'),
          readingProgress: header('readingProgress'),
          allMembers: header('allMembers'),
          allAlbums: header('allAlbums'),
          latestReleases: header('latestReleases'),
          membersHref: '/integrantes',
          albumsHref: '/discografia',
        }}
        searchLabels={{
          title: search('title'),
          placeholder: search('placeholder'),
          empty: search('empty'),
          loading: search('loading'),
          hint: search('hint'),
          close: search('close'),
        }}
      />

      <main id="contenido" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>

      <SiteFooter
        locale={locale}
        columns={footerColumns}
        socials={OFFICIAL_LINKS}
        localePrefix={`/${locale}`}
        labels={{
          tagline: footer('tagline'),
          officialTitle: footer('officialTitle'),
          officialNote: footer('officialNote'),
          legal: footer('legal'),
          credit: footer('credit'),
        }}
      />
    </>
  );
}
