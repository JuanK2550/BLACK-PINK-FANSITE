// Menú del móvil.
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@blackpink/types';
import { cn } from '../cn';
import { LanguageSwitcher, ThemeToggle } from '../controls/controls';
import { ChevronDownIcon, CloseIcon, SearchIcon } from '../icons';
import { MediaFrame } from '../media/media-frame';
import { PanelFooterLink } from './mega-menu';
import type { AlbumSummary, MemberSummary, NavItem } from './nav-types';

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export interface MobileMenuLabels {
  title: string;
  close: string;
  search: string;
  language: string;
  toLight: string;
  toDark: string;
  allMembers: string;
  allAlbums: string;
}

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  items: NavItem[];
  members: MemberSummary[];
  albums: AlbumSummary[];
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  localePrefix?: string;
  membersHref: string;
  albumsHref: string;
  labels: MobileMenuLabels;
}

export function MobileMenu({
  open,
  onClose,
  onOpenSearch,
  items,
  members,
  albums,
  locale,
  onLocaleChange,
  localePrefix = '',
  membersHref,
  albumsHref,
  labels,
}: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setExpanded(null);
      return;
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const firstNode = nodes[0]!;
      const lastNode = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={labels.title}
          initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0.6 }}
          animate={{
            clipPath: 'inset(0 0 0% 0)',
            opacity: 1,
            transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
          }}
          exit={{
            clipPath: 'inset(0 0 100% 0)',
            opacity: 0,
            transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
          }}
          className="bg-canvas z-80 fixed inset-0 flex flex-col overflow-y-auto xl:hidden"
        >
          <div className="border-line h-header px-gutter flex shrink-0 items-center justify-between border-b">
            <button
              type="button"
              onClick={onOpenSearch}
              className="text-fg-muted hover:text-fg hover:bg-accent-tint ease-out-soft -ml-2 inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm transition-colors duration-[var(--dur-2)] active:scale-[0.97]"
            >
              <SearchIcon className="text-lg" />
              {labels.search}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={labels.close}
              className="text-fg hover:bg-accent-tint ease-out-soft -mr-2 grid h-10 w-10 place-items-center rounded-full text-xl transition-colors duration-[var(--dur-2)] active:scale-[0.94]"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="px-gutter flex-1 py-6" aria-label={labels.title}>
            <ul>
              {items.map((item, index) => (
                <motion.li
                  key={item.key}
                  initial={{ opacity: 0, transform: 'translateY(12px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  transition={{
                    delay: 0.06 + index * 0.045,
                    duration: 0.3,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className="border-line border-b last:border-b-0"
                >
                  {item.panel ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={expanded === item.key}
                        aria-controls={`mobile-panel-${item.key}`}
                        onClick={() => setExpanded((key) => (key === item.key ? null : item.key))}
                        className="text-fg group flex w-full items-center justify-between gap-4 py-4 text-left"
                      >
                        <span className="font-display text-3xl font-bold">{item.label}</span>
                        <ChevronDownIcon
                          className={cn(
                            'text-fg-subtle ease-out-bp shrink-0 text-xl transition-transform duration-[var(--dur-3)]',
                            expanded === item.key && 'rotate-180',
                          )}
                        />
                      </button>
                      {expanded === item.key ? (
                        <div id={`mobile-panel-${item.key}`} className="pb-5">
                          {item.panel === 'members' ? (
                            <>
                              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {members.map((member) => (
                                  <li key={member.slug}>
                                    <a
                                      href={`${localePrefix}${member.href}`}
                                      className="group/card block"
                                    >
                                      {member.photo ?? (
                                        <MediaFrame
                                          ratio="portrait"
                                          glyph={member.glyph}
                                          label={member.name}
                                          zoom
                                        />
                                      )}
                                      <span className="font-display text-fg mt-2 block text-sm font-bold">
                                        {member.name}
                                      </span>
                                      <span className="text-fg-subtle block text-xs">
                                        {member.role}
                                      </span>
                                    </a>
                                  </li>
                                ))}
                              </ul>
                              <PanelFooterLink
                                href={membersHref}
                                label={labels.allMembers}
                                onNavigate={onClose}
                              />
                            </>
                          ) : (
                            <>
                              <ul>
                                {albums.map((album) => (
                                  <li key={album.slug}>
                                    <a
                                      href={`${localePrefix}${album.href}`}
                                      className="text-fg-muted hover:text-fg ease-out-soft flex items-center justify-between gap-4 py-2 text-sm transition-colors duration-[var(--dur-2)]"
                                    >
                                      <span className="truncate">{album.title}</span>
                                      <time
                                        className="text-fg-subtle shrink-0 text-xs"
                                        dateTime={String(album.year)}
                                      >
                                        {album.year}
                                      </time>
                                    </a>
                                  </li>
                                ))}
                              </ul>
                              <PanelFooterLink
                                href={albumsHref}
                                label={labels.allAlbums}
                                onNavigate={onClose}
                              />
                            </>
                          )}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <a
                      href={`${localePrefix}${item.href}`}
                      onClick={onClose}
                      className="font-display text-fg hover:text-accent-text ease-out-soft block py-4 text-3xl font-bold transition-colors duration-[var(--dur-2)]"
                    >
                      {item.label}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>
          </nav>

          <div className="border-line px-gutter flex shrink-0 items-center justify-between gap-4 border-t py-4">
            <LanguageSwitcher
              locale={locale}
              onChange={onLocaleChange}
              label={labels.language}
              placement="above"
            />
            <ThemeToggle labelToLight={labels.toLight} labelToDark={labels.toDark} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
