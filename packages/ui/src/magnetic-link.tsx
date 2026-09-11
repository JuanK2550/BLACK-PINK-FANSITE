'use client';

import type { AnchorHTMLAttributes } from 'react';
import { buttonStyles, type ButtonStyleOptions } from './button';
import { useMagnetic } from './use-magnetic';

/**
 * Un enlace vestido de boton, con hover magnetico.
 *
 * Existe porque los reclamos principales del sitio son ENLACES, no botones:
 * llevan a otra pagina, y un boton que navega miente sobre lo que hace. Este
 * componente es el mismo `buttonStyles` de siempre mas el iman, sin tocar la
 * semantica.
 *
 * El iman se apaga solo en tactil y con `prefers-reduced-motion`; la decision
 * esta explicada en `use-magnetic.ts`.
 */
export interface MagneticLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>, ButtonStyleOptions {
  /** Fuerza del iman en pixeles. */
  strength?: number;
}

export function MagneticLink({ variant, size, className, strength, ...props }: MagneticLinkProps) {
  const ref = useMagnetic<HTMLAnchorElement>({ strength });

  return <a ref={ref} className={buttonStyles({ variant, size, className })} {...props} />;
}
