// Tipos del contenido: integrantes, discos, canciones y catálogo.

import type { Locale } from './locale';

export const ALBUM_TYPES = ['SINGLE', 'EP', 'ALBUM', 'COMPILATION', 'COLLABORATION'] as const;
export type AlbumType = (typeof ALBUM_TYPES)[number];

export const SOLO_WORK_TYPES = ['SINGLE', 'EP', 'ALBUM', 'COLLABORATION', 'OST', 'OTHER'] as const;
export type SoloWorkType = (typeof SOLO_WORK_TYPES)[number];

export const TIMELINE_CATEGORIES = [
  'DEBUT',
  'COMEBACK',
  'AWARD',
  'TOUR',
  'RECORD',
  'SOLO',
  'OTHER',
] as const;
export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export const TRIVIA_CATEGORIES = [
  'GROUP',
  'MEMBER',
  'MUSIC',
  'RECORD',
  'FANDOM',
  'STAGE',
  'OTHER',
] as const;
export type TriviaCategory = (typeof TRIVIA_CATEGORIES)[number];

export const QUIZ_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];

export type DatePrecision = 'day' | 'month' | 'year';

export type IsoDate = string;

export interface MemberSummary {
  slug: string;
  stageName: string;
  fullName: string;
  koreanName: string | null;
  position: string;
  nationality: string;
  birthDate: IsoDate | null;
  colorAccent: string | null;

  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  imageAuthor: string | null;
  imageLicense: string | null;
  imageLicenseUrl: string | null;
  imageSource: string | null;
  imageDate: IsoDate | null;
  imageFocus: string | null;
  imageAlt: string | null;

  verified: boolean;
}

export interface SoloTrack {
  id: string;
  title: string;
  trackNumber: number;
  durationSec: number | null;
  isTitleTrack: boolean;
  featuring: string | null;
  spotifyId: string | null;
  verified: boolean;
}

export interface SoloWork {
  slug: string;
  title: string;
  type: SoloWorkType;
  releaseDate: IsoDate;
  formatLabel: string | null;
  description: string | null;
  coverUrl: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  coverThumbUrl: string | null;
  coverThumbWidth: number | null;
  coverThumbHeight: number | null;
  durationSec: number | null;
  spotifyId: string | null;
  verified: boolean;
  tracks: SoloTrack[];
}

export interface MemberTrivia {
  id: string;
  category: TriviaCategory;
  content: string;
  source: string;
  verified: boolean;
}

export interface MemberTimelineEvent {
  id: string;
  date: IsoDate;
  datePrecision: DatePrecision;
  title: string;
  description: string | null;
  category: TimelineCategory;
  importance: number;
  verified: boolean;
}

export interface MemberDetail extends MemberSummary {
  nickname: string | null;
  bio: string | null;
  description: string | null;
  socials: Record<string, string> | null;
  soloWorks: SoloWork[];
  trivia: MemberTrivia[];
  timeline: MemberTimelineEvent[];
}

export interface Track {
  id: string;
  title: string;
  trackNumber: number;
  durationSec: number | null;
  isTitleTrack: boolean;
  localizedTitle: string | null;
  spotifyId: string | null;
  lyricsAvailable: boolean;
  verified: boolean;
}

export interface AlbumSummary {
  slug: string;
  title: string;
  type: AlbumType;
  releaseDate: IsoDate;
  year: number;
  formatLabel: string | null;
  label: string | null;
  coverUrl: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  coverThumbUrl: string | null;
  coverThumbWidth: number | null;
  coverThumbHeight: number | null;
  trackCount: number;
  verified: boolean;
}

export interface AlbumDetail extends AlbumSummary {
  description: string | null;
  spotifyId: string | null;
  tracks: Track[];
}

export interface TrackDetail extends Track {
  album: { slug: string; title: string; releaseDate: IsoDate };
}

export interface TimelineEvent {
  id: string;
  date: IsoDate;
  datePrecision: DatePrecision;
  title: string;
  description: string | null;
  category: TimelineCategory;
  importance: number;
  memberSlug: string | null;
  imageUrl: string | null;
  source: string | null;
  verified: boolean;
}

export interface Trivia {
  id: string;
  category: TriviaCategory;
  content: string;
  source: string;
  memberSlug: string | null;
  verified: boolean;
}

export interface Award {
  id: string;
  name: string;
  category: string;
  year: number;
  organization: string;
  work: string | null;
  won: boolean;
  source: string | null;
  verified: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  difficulty: QuizDifficulty;
  correctIndex?: number;
  explanation?: string | null;
}

export type SearchHitType = 'member' | 'album' | 'track' | 'timeline';

export interface SearchHit {
  type: SearchHitType;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

export interface SearchResult {
  query: string;
  total: number;
  members: SearchHit[];
  albums: SearchHit[];
  tracks: SearchHit[];
  timeline: SearchHit[];
}

export interface EmbedTarget {
  id: string;
  embedUrl: string;
  watchUrl: string;
}

export interface PlaylistEntry {
  position: number;
  title: string;
  subtitle: string | null;
  durationSec: number | null;
  spotify: EmbedTarget | null;
  playable: boolean;
}

export type PlaylistBasis = 'derived' | 'curated';

export interface PlaylistSummary {
  slug: string;
  title: string;
  description: string;
  trackCount: number;
  basis: PlaylistBasis;
}

export interface PlaylistDetail extends PlaylistSummary {
  entries: PlaylistEntry[];
  playableCount: number;
  note: string | null;
}

export interface TrackEmbed {
  trackId: string;
  title: string;
  album: { slug: string; title: string; year: number } | null;
  spotify: EmbedTarget | null;
  available: boolean;
  note: string | null;
}

export interface LocaleParams {
  locale?: Locale;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface UnverifiedParams {
  includeUnverified?: boolean;
}

export type ContentParams = LocaleParams & PaginationParams & UnverifiedParams;
