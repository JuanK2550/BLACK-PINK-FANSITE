// Cabecera del sitio con navegación y buscador.
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@blackpink/types';
import { cn } from '../cn';
import { Container } from './container';
import { LanguageSwitcher, ThemeToggle } from '../controls/controls';
import { MenuIcon, SearchIcon } from '../icons';
import { AlbumsPanel, MembersPanel } from './mega-menu';
import { MobileMenu } from './mobile-menu';
import type { AlbumSummary, MemberSummary, NavItem, SearchEntry } from './nav-types';
import { ScrollProgress } from './scroll-progress';
import { SearchDialog, type SearchLabels } from './search-dialog';
import { Wordmark } from './wordmark';

export interface HeaderLabels {
  home: string;
  primaryNav: string;
  openMenu: string;
  closeMenu: string;
  menuTitle: string;
  search: string;
  language: string;
  toLight: string;
  toDark: string;
  readingProgress: string;
  allMembers: string;
  allAlbums: string;
  latestReleases: string;
  membersHref: string;
  albumsHref: string;
}

export interface SiteHeaderProps {
  items: NavItem[];
  members: MemberSummary[];
  albums: AlbumSummary[];
  searchEntries: SearchEntry[];
  searchRemote?: boolean;
  searchLoading?: boolean;
  onSearchQueryChange?: (query: string) => void;
  locale: Locale;
  localePrefix?: string;
  onLocaleChange: (locale: Locale) => void;
  labels: HeaderLabels;
  searchLabels: SearchLabels;
}

const HOVER_OPEN_MS = 90;
const HOVER_CLOSE_MS = 140;

export function SiteHeader({
  items,
  members,
  albums,
  searchEntries,
  localePrefix = '',
  searchRemote = false,
  searchLoading = false,
  onSearchQueryChange,
  locale,
  onLocaleChange,
  labels,
  searchLabels,
}: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.userAgent));

    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpenPanel(null);
        setMobileOpen(false);
        setSearchOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpenPanel(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  const canHover = useCallback(
    () => window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    [],
  );

  function scheduleOpen(key: string) {
    if (!canHover()) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setOpenPanel(key), HOVER_OPEN_MS);
  }

  function scheduleClose() {
    if (!canHover()) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setOpenPanel(null), HOVER_CLOSE_MS);
  }

  function closePanel(returnFocusTo?: string) {
    clearHoverTimer();
    setOpenPanel(null);
    if (returnFocusTo) triggerRefs.current[returnFocusTo]?.focus();
  }

  const activeItem = items.find((item) => item.key === openPanel) ?? null;

  return (
    <>
      <header
        ref={headerRef}
        className="z-70 sticky top-0"
        onMouseLeave={scheduleClose}
        onBlur={(event) => {
          if (!headerRef.current?.contains(event.relatedTarget as Node)) setOpenPanel(null);
        }}
      >
        <div
          className={cn(
            'ease-out-soft transition-[background-color,box-shadow,backdrop-filter] duration-[var(--dur-3)]',
            scrolled || openPanel
              ? 'bg-glass border-line border-b backdrop-blur-xl backdrop-saturate-150'
              : 'border-b border-transparent bg-transparent',
          )}
        >
          <Container width="wide">
            <div
              className={cn(
                'flex items-center justify-between gap-4',
                'ease-out-bp transition-[height] duration-[var(--dur-3)]',
                scrolled ? 'h-header' : 'h-header lg:h-header-lg',
              )}
            >
              <a
                href={localePrefix || '/'}
                aria-label={labels.home}
                className="focus-visible:outline-focus rounded-xs focus-visible:outline-offset-6 shrink-0 focus-visible:outline-2"
              >
                <Wordmark className="text-xl sm:text-2xl" />
              </a>

              <nav aria-label={labels.primaryNav} className="hidden lg:block">
                <ul className="flex items-center gap-1">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      onMouseEnter={() => (item.panel ? scheduleOpen(item.key) : scheduleClose())}
                    >
                      {item.panel ? (
                        <button
                          ref={(node) => {
                            triggerRefs.current[item.key] = node;
                          }}
                          type="button"
                          aria-expanded={openPanel === item.key}
                          aria-controls={`mega-${item.key}`}
                          onClick={() =>
                            setOpenPanel((key) => (key === item.key ? null : item.key))
                          }
                          className={navLinkClass(openPanel === item.key)}
                        >
                          {item.label}
                          <NavUnderline active={openPanel === item.key} />
                        </button>
                      ) : (
                        <a href={`${localePrefix}${item.href}`} className={navLinkClass(false)}>
                          {item.label}
                          <NavUnderline active={false} />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label={labels.search}
                  className={cn(
                    'text-fg-muted hover:text-fg hover:bg-accent-tint inline-flex h-9 items-center gap-2 rounded-full',
                    'ease-out-soft px-3 text-sm transition-colors duration-[var(--dur-2)]',
                    'active:scale-[0.97] active:duration-[var(--dur-1)]',
                  )}
                >
                  <SearchIcon className="text-lg" />
                  <span className="hidden xl:inline">{labels.search}</span>
                  <kbd className="border-line text-fg-subtle text-2xs rounded-xs hidden border px-1.5 py-0.5 font-sans xl:inline">
                    {isMac ? '⌘' : 'Ctrl'} K
                  </kbd>
                </button>

                <LanguageSwitcher
                  locale={locale}
                  onChange={onLocaleChange}
                  label={labels.language}
                  className="hidden sm:block"
                />
                <ThemeToggle
                  labelToLight={labels.toLight}
                  labelToDark={labels.toDark}
                  className="hidden sm:grid"
                />

                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label={labels.openMenu}
                  aria-expanded={mobileOpen}
                  className="text-fg hover:bg-accent-tint ease-out-soft grid h-10 w-10 place-items-center rounded-full text-xl transition-colors duration-[var(--dur-2)] active:scale-[0.94] lg:hidden"
                >
                  <MenuIcon />
                </button>
              </div>
            </div>
          </Container>

          <ScrollProgress label={labels.readingProgress} />
        </div>

        <AnimatePresence>
          {activeItem?.panel ? (
            <motion.div
              key={activeItem.key}
              id={`mega-${activeItem.key}`}
              initial={{ opacity: 0, transform: 'translateY(-10px)', filter: 'blur(6px)' }}
              animate={{
                opacity: 1,
                transform: 'translateY(0px)',
                filter: 'blur(0px)',
                transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] },
              }}
              exit={{
                opacity: 0,
                transform: 'translateY(-8px)',
                filter: 'blur(4px)',
                transition: { duration: 0.16, ease: [0.23, 1, 0.32, 1] },
              }}
              onMouseEnter={clearHoverTimer}
              onMouseLeave={scheduleClose}
              onKeyDown={(event) => {
                if (event.key === 'Escape') closePanel(activeItem.key);
              }}
              className="bg-glass border-line absolute inset-x-0 top-full hidden border-b backdrop-blur-xl backdrop-saturate-150 lg:block"
            >
              <Container width="wide" className="py-8">
                {activeItem.panel === 'members' ? (
                  <MembersPanel
                    members={members}
                    localePrefix={localePrefix}
                    allLabel={labels.allMembers}
                    allHref={`${localePrefix}${labels.membersHref}`}
                    onNavigate={() => closePanel()}
                  />
                ) : (
                  <AlbumsPanel
                    albums={albums}
                    localePrefix={localePrefix}
                    allLabel={labels.allAlbums}
                    allHref={`${localePrefix}${labels.albumsHref}`}
                    columnLabel={labels.latestReleases}
                    onNavigate={() => closePanel()}
                  />
                )}
              </Container>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpenSearch={() => {
          setMobileOpen(false);
          setSearchOpen(true);
        }}
        items={items}
        members={members}
        albums={albums}
        localePrefix={localePrefix}
        locale={locale}
        onLocaleChange={onLocaleChange}
        labels={{
          title: labels.menuTitle,
          close: labels.closeMenu,
          search: labels.search,
          language: labels.language,
          toLight: labels.toLight,
          toDark: labels.toDark,
        }}
      />

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        entries={searchEntries}
        labels={searchLabels}
        remote={searchRemote}
        loading={searchLoading}
        onQueryChange={onSearchQueryChange}
      />
    </>
  );
}

function navLinkClass(active: boolean) {
  return cn(
    'group relative inline-flex h-9 items-center rounded-xs px-3 text-sm font-medium',
    'transition-colors duration-[var(--dur-2)] ease-out-soft',
    'focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-2',
    active ? 'text-fg' : 'text-fg-muted hover:text-blush',
  );
}

function NavUnderline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-accent pointer-events-none absolute inset-x-3 bottom-1 h-px origin-left',
        'ease-out-bp transition-transform duration-[var(--dur-2)]',
        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
      )}
    />
  );
}
