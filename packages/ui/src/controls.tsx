'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@blackpink/types';
import { cn } from './cn';
import { ChevronDownIcon, GlobeIcon, MoonIcon, SunIcon } from './icons';

/* ==========================================================================
 * Selector de idioma
 * ======================================================================= */

export const LOCALE_LABELS: Record<Locale, { short: string; long: string }> = {
  es: { short: 'ES', long: 'Español' },
  en: { short: 'EN', long: 'English' },
  ko: { short: 'KO', long: '한국어' },
};

export interface LanguageSwitcherProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
  label: string;
  className?: string;
}

export function LanguageSwitcher({ locale, onChange, label, className }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'text-fg-muted hover:text-fg inline-flex h-9 items-center gap-1.5 rounded-full px-3',
          'ease-out-soft text-xs font-medium transition-colors duration-[var(--dur-2)]',
          'hover:bg-accent-tint active:scale-[0.97] active:duration-[var(--dur-1)]',
          open && 'bg-accent-tint text-fg',
        )}
      >
        <GlobeIcon className="text-base" />
        {LOCALE_LABELS[locale].short}
        <ChevronDownIcon
          className={cn(
            'ease-out-bp text-sm transition-transform duration-[var(--dur-2)]',
            open && 'rotate-180',
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            'bg-overlay shadow-lift-2 shadow-hairline z-70 absolute right-0 mt-2 w-40 overflow-hidden rounded-md p-1',
            'animate-bp-fade origin-top-right',
          )}
        >
          {(Object.keys(LOCALE_LABELS) as Locale[]).map((value) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={value === locale}
              lang={value}
              onClick={() => {
                onChange(value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm',
                'ease-out-soft transition-colors duration-[var(--dur-2)]',
                value === locale
                  ? 'text-accent-text bg-accent-tint'
                  : 'text-fg-muted hover:text-fg hover:bg-accent-tint',
              )}
            >
              {LOCALE_LABELS[value].long}
              <span className="text-fg-subtle text-2xs">{LOCALE_LABELS[value].short}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ==========================================================================
 * Tema
 * ======================================================================= */

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'bp-theme';

export interface ThemeToggleProps {
  labelToLight: string;
  labelToDark: string;
  className?: string;
}

/**
 * Alterna entre oscuro y claro. El oscuro es el defecto del sitio; el claro
 * es una eleccion del usuario, y por eso se guarda.
 * El estado real vive en el atributo data-theme del <html>, que el script en
 * linea de layout.tsx ya ha escrito antes del primer pintado.
 */
export function ThemeToggle({ labelToLight, labelToDark, className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(current);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Modo privado o almacenamiento bloqueado: el tema dura la sesion.
    }
  }

  const label = theme === 'dark' ? labelToLight : labelToDark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'text-fg-muted hover:text-fg hover:bg-accent-tint grid h-9 w-9 place-items-center rounded-full',
        'ease-out-soft text-base transition-colors duration-[var(--dur-2)]',
        'active:scale-[0.94] active:duration-[var(--dur-1)]',
        className,
      )}
    >
      {/* Antes de hidratar no se sabe el tema guardado: se pinta el icono del
          defecto en vez de parpadear con el equivocado. */}
      {mounted && theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
