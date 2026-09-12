// Botón con sus variantes.
'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../cn';
import { useMagnetic } from './use-magnetic';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover shadow-glow-sm hover:shadow-glow',
  secondary: 'bg-surface text-fg shadow-hairline hover:bg-overlay',
  ghost: 'bg-transparent text-fg-muted hover:text-fg hover:bg-accent-tint',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
};

export function buttonStyles({ variant = 'primary', size = 'md', className }: ButtonStyleOptions) {
  return cn(
    'group/btn inline-flex items-center justify-center gap-2 rounded-full',
    'font-medium whitespace-nowrap select-none',
    'transition-[transform,background-color,color,box-shadow] duration-[var(--dur-2)] ease-out-bp',
    'active:scale-[0.97] active:duration-[var(--dur-1)]',
    'disabled:pointer-events-none disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {
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
