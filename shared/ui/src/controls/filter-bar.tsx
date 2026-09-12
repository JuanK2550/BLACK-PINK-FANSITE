// Barra de filtros (grupo de opciones).
'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '../cn';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  bleed?: boolean;
  className?: string;
}

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
