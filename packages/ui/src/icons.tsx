import type { SVGProps } from 'react';

/**
 * Set de iconos dibujado a mano para este sistema.
 * Rejilla 24, trazo 1.5, extremos y uniones redondeados, sin relleno.
 * No se usan emoji ni glifos unicode como iconos: no comparten peso ni
 * rejilla y delatan una interfaz montada en vez de disenada.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Icon>
  );
}

/** Minimizar: chevron hacia abajo con una base, distinto del chevron suelto. */
export function MinimizeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 10.5 12 14.5 16 10.5" />
      <path d="M5 18.5h14" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 7h17M3.5 12h17M3.5 17h11" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5.5 9 6.5 6.5L18.5 9" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h15.5" />
      <path d="m13.5 6 6 6-6 6" />
    </Icon>
  );
}

/**
 * Intercambiar. Dos flechas opuestas en carriles separados, no una flecha de
 * doble punta: la doble punta se lee a «rango» o a «redimensionar», y aquí lo
 * que ocurre es que dos cosas cambian de sitio.
 */
export function SwapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8.5h15.5" />
      <path d="m15.5 4.5 4 4-4 4" />
      <path d="M20 15.5H4.5" />
      <path d="m8.5 11.5-4 4 4 4" />
    </Icon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5s-1.2 6.1-3.4 8.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 13.2A8.2 8.2 0 0 1 10.8 4a8.5 8.5 0 1 0 9.2 9.2Z" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function ReturnIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 5v6a3 3 0 0 1-3 3H5.5" />
      <path d="m9 10-3.5 4L9 18" />
    </Icon>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 17 4.6-4.2a1.6 1.6 0 0 1 2.2 0L16 17.5" />
      <path d="m14 14.5 1.6-1.5a1.6 1.6 0 0 1 2.2 0L20.5 15" />
    </Icon>
  );
}

/** Reproducir. Relleno a proposito: hueco se confunde con "siguiente". */

export function MicIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
    </Icon>
  );
}

/** El microfono tachado: permiso denegado o sin microfono. */
export function MicOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5.5A3 3 0 0 1 15 5.5v5" />
      <path d="M9 9.5V11a3 3 0 0 0 4.7 2.5" />
      <path d="M5.5 11a6.5 6.5 0 0 0 9.9 5.5M18.5 11v-.5" />
      <path d="M12 17.5V21" />
      <path d="m3.5 3 17 18" />
    </Icon>
  );
}

/** Altavoz con ondas: la voz esta encendida. */
export function SpeakerIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5h3l4.5-3.5v12L7 14.5H4z" />
      <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M17.5 7a7 7 0 0 1 0 10" />
    </Icon>
  );
}

/** Altavoz tachado: la voz esta apagada. Es el estado por defecto. */
export function SpeakerOffIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5h3l4.5-3.5v12L7 14.5H4z" />
      <path d="m16 9.5 4.5 5M20.5 9.5l-4.5 5" />
    </Icon>
  );
}

/** Clip: adjuntar un audio que ya existe. */
export function ClipIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17.5 8.5 9.9 16a2.8 2.8 0 0 1-4-4l8-8a4.2 4.2 0 0 1 6 6l-8 8a5.6 5.6 0 0 1-8-8l7-7" />
    </Icon>
  );
}
