// Enlace con aspecto de botón y efecto magnético.
'use client';

import type { AnchorHTMLAttributes } from 'react';
import { buttonStyles, type ButtonStyleOptions } from './button';
import { useMagnetic } from './use-magnetic';

export interface MagneticLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>, ButtonStyleOptions {
  strength?: number;
}

export function MagneticLink({ variant, size, className, strength, ...props }: MagneticLinkProps) {
  const ref = useMagnetic<HTMLAnchorElement>({ strength });

  return <a ref={ref} className={buttonStyles({ variant, size, className })} {...props} />;
}
