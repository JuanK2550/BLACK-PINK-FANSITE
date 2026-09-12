// Estructura común: aviso, cabecera, contenido y pie.
'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { AlbumSummary, Locale, MemberSummary } from '@blackpink/types';
import { AlbumCover } from '../discography/album-cover';
import { MemberPhoto } from '../members/member-photo';
import { DisclaimerBanner, SiteFooter, SiteHeader, SkipLink } from '@blackpink/ui';
import type { FooterColumn, NavItem, SearchEntry } from '@blackpink/ui';
import { OFFICIAL_LINKS } from '../../data/site';
import { usePathname, useRouter } from '../../i18n/routing';

export interface SiteChromeProps {
  children: ReactNode;
  members: MemberSummary[];
  albums: AlbumSummary[];
}

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
          { label: nav('creditos'), href: '/creditos' },
        ],
      },
    ],
    [footer, nav],
  );

  const trimmed = query.trim();

  const { data, isFetching } = useQuery({
    queryKey: ['search', trimmed, locale],
    queryFn: async ({ signal }) => {
      const { search: runSearch } = await import('../../lib/api');
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
          photo: (
            <MemberPhoto member={member} zoom hideCredit sizes="(max-width: 768px) 44vw, 256px" />
          ),
        }))}
        albums={albums.map((album) => ({
          slug: album.slug,
          title: album.title,
          year: album.year,
          format: album.formatLabel ?? album.type,
          href: `/discografia/${album.slug}`,
          cover: (
            <AlbumCover
              cover={album}
              title={album.title}
              alt={a11y('coverAlt', { title: album.title })}
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
