'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import { useMagnetic } from './use-magnetic';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
  /* Texto oscuro sobre el rosa: blanco sobre #ff2e88 da 3.5:1 y suspende AA. */
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-glow-sm hover:shadow-glow',
  secondary: 'bg-surface text-fg shadow-hairline hover:bg-overlay',
  ghost: 'bg-transparent text-fg-muted hover:text-fg hover:bg-accent-tint',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
};

/**
 * Estilos del boton como funcion, para que un <a> pueda vestirse de boton
 * sin recurrir a un boton dentro de un enlace.
 */
export function buttonStyles({ variant = 'primary', size = 'md', className }: ButtonStyleOptions) {
  return cn(
    'group/btn inline-flex items-center justify-center gap-2 rounded-full',
    'font-medium whitespace-nowrap select-none',
    // Solo transform y colores: ambos van a GPU y no provocan layout.
    'transition-[transform,background-color,color,box-shadow] duration-[var(--dur-2)] ease-out-bp',
    // Feedback de pulsacion: la interfaz confirma que ha oido al usuario.
    'active:scale-[0.97] active:duration-[var(--dur-1)]',
    'disabled:pointer-events-none disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {
  /**
   * Hover magnetico. Por defecto SOLO en el primario.
   *
   * No es tacaneria: en una pantalla con seis botones, seis imanes son ruido.
   * El primario es el unico sitio donde el sitio pide de verdad que se pulse,
   * y el iman es una invitacion. Los secundarios y los fantasma acompañan.
   */
  magnetic?: boolean;
}

export function Button({
  variant = 'primary',
  size,
  className,
  type = 'button',
  magnetic,
  ...props
}: ButtonProps) {
  const ref = useMagnetic<HTMLButtonElement>({
    disabled: !(magnetic ?? variant === 'primary') || props.disabled,
  });

  return (
    <button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
