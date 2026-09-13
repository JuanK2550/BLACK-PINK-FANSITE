// Menú desplegable de la cabecera.
'use client';

import { motion } from 'framer-motion';
import { cn } from '../cn';
import { ArrowRightIcon } from '../icons';
import { MediaFrame } from '../media/media-frame';
import type { AlbumSummary, MemberSummary } from './nav-types';

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
};

const item = {
  hidden: { opacity: 0, transform: 'translateY(10px)' },
  show: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] as const },
  },
};

export interface MembersPanelProps {
  members: MemberSummary[];
  localePrefix?: string;
  allLabel: string;
  allHref: string;
  onNavigate?: () => void;
}

export function MembersPanel({
  members,
  localePrefix = '',
  allLabel,
  allHref,
  onNavigate,
}: MembersPanelProps) {
  return (
    <div>
      <motion.ul
        variants={list}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
      >
        {members.map((member) => (
          <motion.li key={member.slug} variants={item}>
            <a
              href={`${localePrefix}${member.href}`}
              onClick={onNavigate}
              className="group/card focus-visible:outline-focus block focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {member.photo ?? (
                <MediaFrame ratio="portrait" glyph={member.glyph} label={member.name} zoom />
              )}
              <p className="font-display text-fg group-hover/card:text-accent-text ease-out-soft mt-3 text-lg font-bold transition-colors duration-[var(--dur-2)]">
                {member.name}
              </p>
              <p className="text-fg-muted mt-0.5 text-xs">
                {member.role}
                <span className="text-fg-subtle" lang="ko">
                  {' '}
                  · {member.nameKo}
                </span>
              </p>
            </a>
          </motion.li>
        ))}
      </motion.ul>
      <PanelFooterLink href={allHref} label={allLabel} onNavigate={onNavigate} />
    </div>
  );
}

export interface AlbumsPanelProps {
  albums: AlbumSummary[];
  localePrefix?: string;
  allLabel: string;
  allHref: string;
  columnLabel: string;
  onNavigate?: () => void;
}

export function AlbumsPanel({
  albums,
  localePrefix = '',
  allLabel,
  allHref,
  columnLabel,
  onNavigate,
}: AlbumsPanelProps) {
  return (
    <div>
      <p className="text-fg-subtle text-2xs mb-4" data-uppercase>
        {columnLabel}
      </p>
      <motion.ul
        variants={list}
        initial="hidden"
        animate="show"
        className="grid gap-x-8 gap-y-1 sm:grid-cols-2"
      >
        {albums.map((album) => (
          <motion.li key={album.slug} variants={item}>
            <a
              href={`${localePrefix}${album.href}`}
              onClick={onNavigate}
              className={cn(
                'group/row -mx-3 flex items-center gap-4 rounded-sm px-3 py-2.5',
                'hover:bg-accent-tint ease-out-soft transition-colors duration-[var(--dur-2)]',
                'focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-1',
              )}
            >
              {album.cover ?? (
                <MediaFrame
                  ratio="square"
                  glyph={String(album.year).slice(2)}
                  className="w-14 shrink-0"
                />
              )}
              <span className="min-w-0 flex-1">
                <span className="text-fg group-hover/row:text-accent-text ease-out-soft block truncate text-sm font-medium transition-colors duration-[var(--dur-2)]">
                  {album.title}
                </span>
                <span className="text-fg-subtle block text-xs">{album.format}</span>
              </span>
              <time className="text-fg-muted text-xs" dateTime={String(album.year)}>
                {album.year}
              </time>
            </a>
          </motion.li>
        ))}
      </motion.ul>
      <PanelFooterLink href={allHref} label={allLabel} onNavigate={onNavigate} />
    </div>
  );
}

export function PanelFooterLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="border-line mt-6 border-t pt-4">
      <a
        href={href}
        onClick={onNavigate}
        className="group/link text-accent-text focus-visible:outline-focus inline-flex items-center gap-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {label}
        <ArrowRightIcon className="ease-out-bp transition-transform duration-[var(--dur-2)] group-hover/link:translate-x-1" />
      </a>
    </div>
  );
}
