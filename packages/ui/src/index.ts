/* Primitivas ------------------------------------------------------------- */
export { cn } from './cn';
export type { ClassValue } from './cn';
export { Button, buttonStyles } from './button';
export type { ButtonProps, ButtonSize, ButtonStyleOptions, ButtonVariant } from './button';
export { MagneticLink } from './magnetic-link';
export type { MagneticLinkProps } from './magnetic-link';
export { useMagnetic } from './use-magnetic';
export type { MagneticOptions } from './use-magnetic';
export { KonamiEasterEgg } from './konami';
export type { KonamiEasterEggProps } from './konami';
export { Container } from './container';
export type { ContainerProps, ContainerWidth } from './container';
export { SkipLink, VisuallyHidden } from './a11y';
export type { SkipLinkProps, VisuallyHiddenProps } from './a11y';
export { Badge, Section, SectionHeading } from './section';
export type { SectionHeadingProps, SectionProps } from './section';
export { MediaFrame } from './media-frame';
export type { MediaFrameProps, MediaRatio } from './media-frame';
export { Wordmark } from './wordmark';
export { LoadingRegion, Skeleton, SkeletonText } from './skeleton';
export type { LoadingRegionProps, SkeletonProps, SkeletonTextProps } from './skeleton';
export { EmptyState, StateMessage } from './states';
export { TiltCard } from './tilt-card';
export type { TiltCardProps } from './tilt-card';
export { FlipCard } from './flip-card';
export type { FlipCardProps } from './flip-card';
export { Reveal } from './reveal';
export type { RevealProps } from './reveal';
export { CountUp } from './count-up';
export type { CountUpProps } from './count-up';
export { EmbedPlayer } from './embed-player';
export type { EmbedPlayerProps, EmbedTargetLike } from './embed-player';
export { FilterBar } from './filter-bar';
export type { FilterBarProps, FilterOption } from './filter-bar';
export type { EmptyStateProps, StateMessageProps } from './states';
export type { WordmarkProps } from './wordmark';

/* Iconos ------------------------------------------------------------------ */
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

/* Controles --------------------------------------------------------------- */
export { LanguageSwitcher, LOCALE_LABELS, ThemeToggle, THEME_STORAGE_KEY } from './controls';
export type { LanguageSwitcherProps, Theme, ThemeToggleProps } from './controls';

/* Estructura del sitio ---------------------------------------------------- */
export { DISCLAIMER, DisclaimerBanner } from './disclaimer-banner';
export type { DisclaimerBannerProps } from './disclaimer-banner';
export { SiteHeader } from './site-header';
export type { HeaderLabels, SiteHeaderProps } from './site-header';
export { SiteFooter } from './site-footer';
export type { FooterLabels, SiteFooterProps } from './site-footer';
export { MobileMenu } from './mobile-menu';
export type { MobileMenuLabels, MobileMenuProps } from './mobile-menu';
export { AlbumsPanel, MembersPanel } from './mega-menu';
export type { AlbumsPanelProps, MembersPanelProps } from './mega-menu';
export { SearchDialog } from './search-dialog';
export type { SearchDialogProps, SearchLabels } from './search-dialog';

/* Movimiento y ambiente --------------------------------------------------- */
export { AmbientBackground } from './ambient-background';
export { PageTransition } from './page-transition';
export type { PageTransitionProps } from './page-transition';
export { ScrollProgress } from './scroll-progress';
export type { ScrollProgressProps } from './scroll-progress';

/* Contratos de datos de la navegacion ------------------------------------- */
export type {
  AlbumSummary,
  FooterColumn,
  MemberSummary,
  NavItem,
  NavPanel,
  SearchEntry,
  SocialLink,
} from './nav-types';
