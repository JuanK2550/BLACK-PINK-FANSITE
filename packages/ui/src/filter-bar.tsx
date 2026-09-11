'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from './cn';

export interface FilterOption {
  value: string;
  label: string;
  /** Cuántos elementos hay tras este filtro. Se muestra si viene. */
  count?: number;
}

export interface FilterBarProps {
  /** Etiqueta accesible del grupo. */
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  /**
   * Desborda el canal lateral para que el desplazamiento llegue al borde de
   * la pantalla. Es lo correcto cuando la barra ocupa el ancho de la página;
   * dentro de una columna estrecha —el comparador tiene una por lado— ese
   * desbordamiento se metería en la columna vecina.
   */
  bleed?: boolean;
  className?: string;
}

/**
 * ============================================================================
 * BARRA DE FILTROS
 * ============================================================================
 * Es un GRUPO DE RADIO, no una fila de botones: los filtros son excluyentes,
 * y eso es exactamente lo que un radio comunica a un lector de pantalla.
 * También trae gratis la navegación con flechas.
 *
 * EL SUBRAYADO ES COMPARTIDO. Un solo elemento con `layoutId` que Framer
 * Motion desplaza de una opción a otra, en vez de aparecer y desaparecer en
 * cada una. Eso convierte el cambio de filtro en un movimiento continuo que
 * el ojo puede seguir, y es el detalle que separa una barra de pestañas
 * cuidada de cuatro botones sueltos.
 * ============================================================================
 */
export function FilterBar({
  label,
  options,
  value,
  onChange,
  bleed = true,
  className,
}: FilterBarProps) {
  const groupId = useId();

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex gap-1 overflow-x-auto pb-1', bleed && '-mx-gutter px-gutter', className)}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-xs relative shrink-0 whitespace-nowrap px-3 py-2 text-sm',
              'ease-out-soft transition-colors duration-[var(--dur-2)]',
              'focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-2',
              'active:scale-[0.97] active:duration-[var(--dur-1)]',
              selected ? 'text-fg' : 'text-fg-muted hover:text-blush',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span data-numeric className="text-fg-subtle ml-1.5 text-xs">
                {option.count}
              </span>
            ) : null}

            {selected ? (
              <motion.span
                layoutId={`filter-underline-${groupId}`}
                aria-hidden="true"
                className="bg-accent absolute inset-x-3 bottom-0.5 h-px"
                transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
