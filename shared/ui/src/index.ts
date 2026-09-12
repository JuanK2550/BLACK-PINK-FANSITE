// Exportaciones de la librería de interfaz.

export { cn } from './cn';
export type { ClassValue } from './cn';
export { Button, buttonStyles } from './controls/button';
export type { ButtonProps, ButtonSize, ButtonStyleOptions, ButtonVariant } from './controls/button';
export { MagneticLink } from './controls/magnetic-link';
export type { MagneticLinkProps } from './controls/magnetic-link';
export { useMagnetic } from './controls/use-magnetic';
export type { MagneticOptions } from './controls/use-magnetic';
export { KonamiEasterEgg } from './effects/konami';
export type { KonamiEasterEggProps } from './effects/konami';
export { Container } from './layout/container';
export type { ContainerProps, ContainerWidth } from './layout/container';
export { SkipLink, VisuallyHidden } from './a11y';
export type { SkipLinkProps, VisuallyHiddenProps } from './a11y';
export { Badge, Section, SectionHeading } from './layout/section';
export type { SectionHeadingProps, SectionProps } from './layout/section';
export { MediaFrame } from './media/media-frame';
export type { MediaFrameProps, MediaRatio } from './media/media-frame';
export { Wordmark } from './layout/wordmark';
export { LoadingRegion, Skeleton, SkeletonText } from './feedback/skeleton';
export type { LoadingRegionProps, SkeletonProps, SkeletonTextProps } from './feedback/skeleton';
export { EmptyState, StateMessage } from './feedback/states';
export { TiltCard } from './effects/tilt-card';
export type { TiltCardProps } from './effects/tilt-card';
export { FlipCard } from './effects/flip-card';
export type { FlipCardProps } from './effects/flip-card';
export { Reveal } from './effects/reveal';
export type { RevealProps } from './effects/reveal';
export { CountUp } from './effects/count-up';
export type { CountUpProps } from './effects/count-up';
export { EmbedPlayer } from './media/embed-player';
export type { EmbedPlayerProps, EmbedTargetLike } from './media/embed-player';
export { FilterBar } from './controls/filter-bar';
export type { FilterBarProps, FilterOption } from './controls/filter-bar';
export type { EmptyStateProps, StateMessageProps } from './feedback/states';
export type { WordmarkProps } from './layout/wordmark';

export {
  ArrowRightIcon,
  ChevronDownIcon,
  CloseIcon,
  MinimizeIcon,
  GlobeIcon,
  ImageIcon,
  MenuIcon,
  MoonIcon,
  PlusIcon,
  ReturnIcon,
  SearchIcon,
  SwapIcon,
  SunIcon,
  MicIcon,
  MicOffIcon,
  SpeakerIcon,
  SpeakerOffIcon,
  ClipIcon,
} from './icons';

export {
  LanguageSwitcher,
  LOCALE_LABELS,
  ThemeToggle,
  THEME_STORAGE_KEY,
} from './controls/controls';
export type { LanguageSwitcherProps, Theme, ThemeToggleProps } from './controls/controls';

export { DISCLAIMER, DisclaimerBanner } from './layout/disclaimer-banner';
export type { DisclaimerBannerProps } from './layout/disclaimer-banner';
export { SiteHeader } from './layout/site-header';
export type { HeaderLabels, SiteHeaderProps } from './layout/site-header';
export { SiteFooter } from './layout/site-footer';
export type { FooterLabels, SiteFooterProps } from './layout/site-footer';
export { MobileMenu } from './layout/mobile-menu';
export type { MobileMenuLabels, MobileMenuProps } from './layout/mobile-menu';
export { AlbumsPanel, MembersPanel } from './layout/mega-menu';
export type { AlbumsPanelProps, MembersPanelProps } from './layout/mega-menu';
export { SearchDialog } from './layout/search-dialog';
export type { SearchDialogProps, SearchLabels } from './layout/search-dialog';

export { AmbientBackground } from './layout/ambient-background';
export { PageTransition } from './layout/page-transition';
export type { PageTransitionProps } from './layout/page-transition';
export { ScrollProgress } from './layout/scroll-progress';
export type { ScrollProgressProps } from './layout/scroll-progress';

export type {
  AlbumSummary,
  FooterColumn,
  MemberSummary,
  NavItem,
  NavPanel,
  SearchEntry,
  SocialLink,
} from './layout/nav-types';
