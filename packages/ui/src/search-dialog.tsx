'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from './cn';
import { ReturnIcon, SearchIcon } from './icons';
import type { SearchEntry } from './nav-types';

export interface SearchLabels {
  title: string;
  placeholder: string;
  empty: string;
  loading: string;
  hint: string;
  close: string;
}

export interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Resultados a mostrar. Los calcula quien llama, no este componente:
   * en el sitio real vienen de la API y aqui solo se pintan.
   */
  entries: SearchEntry[];
  labels: SearchLabels;
  /** Se avisa en cada tecla para que quien llama consulte la API. */
  onQueryChange?: (query: string) => void;
  /** Hay una consulta en vuelo: se anuncia sin vaciar lo que ya se ve. */
  loading?: boolean;
  /**
   * Si es true, este componente NO filtra: confia en `entries` tal cual.
   * El filtrado local solo sirve cuando la lista completa cabe en memoria.
   */
  remote?: boolean;
}

function normalize(value: string) {
  // Quita acentos para que "cronologia" encuentre "cronologia" y "Cronologia".
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Buscador global. Se abre con Cmd/Ctrl + K.
 *
 * DECISION DELIBERADA: no tiene animacion de apertura ni de cierre.
 * Es una accion de teclado que se repite decenas de veces por sesion, y
 * cualquier transicion, por corta que sea, la hace sentir lenta y despegada
 * de la pulsacion. Aparece y ya.
 */
export function SearchDialog({
  open,
  onClose,
  entries,
  labels,
  onQueryChange,
  loading = false,
  remote = false,
}: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    // En modo remoto la lista ya viene filtrada por el servidor: volver a
    // filtrarla aqui escondería resultados que el servidor si considera
    // validos, como una coincidencia en un campo que este componente no ve.
    if (remote) return entries;

    const q = normalize(query.trim());
    if (!q) return entries.slice(0, 8);
    return entries
      .filter((entry) => {
        const haystack = normalize(
          [entry.title, entry.section, ...(entry.keywords ?? [])].join(' '),
        );
        return haystack.includes(q);
      })
      .slice(0, 12);
  }, [entries, query, remote]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Bloqueo del scroll de fondo sin salto de maquetado: se compensa el ancho
  // de la barra de desplazamiento que desaparece.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      inputRef.current?.focus();
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) =>
          results.length ? (index - 1 + results.length) % results.length : 0,
        );
        return;
      }
      if (event.key === 'Enter') {
        const target = results[activeIndex];
        if (target) {
          event.preventDefault();
          window.location.assign(target.href);
        }
        return;
      }
      // Trampa de foco: solo hay un elemento enfocable, asi que Tab no sale.
      if (event.key === 'Tab') {
        event.preventDefault();
      }
    },
    [activeIndex, onClose, results],
  );

  if (!open) return null;

  return (
    <div
      className="z-90 fixed inset-0 flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-label={labels.close}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labels.title}
        className="bg-overlay shadow-lift-2 shadow-hairline relative w-full max-w-xl overflow-hidden rounded-md"
      >
        <div className="border-line flex items-center gap-3 border-b px-4">
          <SearchIcon className="text-fg-subtle shrink-0 text-lg" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              onQueryChange?.(event.target.value);
            }}
            placeholder={labels.placeholder}
            className="text-fg placeholder:text-fg-subtle h-14 w-full bg-transparent text-base outline-none"
          />
          <kbd className="text-fg-subtle border-line rounded-xs text-2xs hidden shrink-0 border px-1.5 py-0.5 sm:block">
            ESC
          </kbd>
        </div>

        {/* Barra de progreso: la busqueda no se bloquea ni se vacia mientras
            llega la siguiente respuesta, solo se anuncia que hay una en vuelo.
            Vaciar la lista en cada tecla hace parpadear el panel entero. */}
        <div aria-hidden="true" className="bg-line relative h-px overflow-hidden">
          {loading ? (
            <span className="bg-accent animate-bp-shimmer absolute inset-0 block" />
          ) : null}
        </div>

        {results.length === 0 ? (
          <p className="text-fg-muted px-4 py-10 text-center text-sm">
            {loading ? labels.loading : labels.empty}
          </p>
        ) : (
          <ul
            id={listId}
            role="listbox"
            aria-label={labels.title}
            className="max-h-80 overflow-y-auto p-2"
          >
            {results.map((entry, index) => (
              <li key={entry.id}>
                <a
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  href={entry.href}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm',
                    index === activeIndex ? 'bg-accent-tint text-fg' : 'text-fg-muted',
                  )}
                >
                  <span className="flex-1 truncate">{entry.title}</span>
                  <span className="text-fg-subtle text-2xs shrink-0" data-uppercase>
                    {entry.section}
                  </span>
                  {index === activeIndex ? (
                    <ReturnIcon className="text-accent-text shrink-0" />
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        )}

        <p className="border-line text-fg-subtle text-2xs border-t px-4 py-2.5">{labels.hint}</p>
      </div>
    </div>
  );
}
