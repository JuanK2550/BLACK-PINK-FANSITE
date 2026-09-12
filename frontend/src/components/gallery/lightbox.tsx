// Visor a pantalla completa de la galería, con teclado y foco atrapado.

'use client';

import { useEffect, useRef, type RefObject } from 'react';
import Image from 'next/image';
import { CloseIcon } from '@blackpink/ui';
import { photoAlt, type GalleryPhoto } from '../../lib/gallery';

export function Lightbox({
  foto,
  posicion,
  total,
  labels,
  onClose,
  onMove,
  disparador,
}: {
  foto: GalleryPhoto;
  posicion: number;
  total: number;
  disparador: RefObject<HTMLButtonElement | null>;
  labels: Record<string, string>;
  onClose: () => void;
  onMove: (paso: number) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const volverA = disparador.current;
    panel.current?.focus();

    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onClose();
      } else if (evento.key === 'ArrowRight') {
        evento.preventDefault();
        onMove(1);
      } else if (evento.key === 'ArrowLeft') {
        evento.preventDefault();
        onMove(-1);
      } else if (evento.key === 'Tab') {
        const focos = panel.current?.querySelectorAll<HTMLElement>('button, a[href]');
        if (!focos || focos.length === 0) return;
        const primero = focos[0]!;
        const ultimo = focos[focos.length - 1]!;
        if (evento.shiftKey && document.activeElement === primero) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    }

    document.addEventListener('keydown', alPulsar);
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = previo;
      volverA?.focus();
    };
  }, [onClose, onMove, disparador]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.lightbox}
      className="bg-canvas/95 z-90 fixed inset-0 flex flex-col backdrop-blur-sm"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onClose();
      }}
    >
      <div ref={panel} tabIndex={-1} className="flex h-full flex-col outline-none">
        <div className="px-gutter flex shrink-0 items-center justify-between gap-4 py-4">
          <p data-numeric className="text-fg-subtle text-2xs" data-uppercase>
            {posicion} / {total}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="text-fg-muted hover:text-fg focus-visible:outline-focus flex h-10 w-10 items-center justify-center rounded-full text-xl focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.92]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-gutter flex min-h-0 flex-1 items-center justify-center">
          <Image
            src={foto.archivo}
            alt={photoAlt(foto, { conAno: labels.altYear!, sinAno: labels.alt! }, labels.grupo!)}
            width={foto.width}
            height={foto.height}
            sizes="(max-width: 1024px) 100vw, 80vw"
            priority
            className="max-h-full w-auto object-contain"
          />
        </div>

        <div className="px-gutter flex shrink-0 flex-wrap items-end justify-between gap-4 py-5">
          <div className="min-w-0">
            {foto.descripcion ? (
              <p className="text-fg max-w-prose text-pretty text-sm">{foto.descripcion}</p>
            ) : null}
            <p className="text-fg-subtle mt-2 text-xs">
              © {foto.autor}
              {' · '}
              {foto.licenciaUrl ? (
                <a
                  href={foto.licenciaUrl}
                  target="_blank"
                  rel="noopener noreferrer license"
                  className="hover:text-accent-text underline underline-offset-2"
                >
                  {foto.licencia}
                </a>
              ) : (
                foto.licencia
              )}
              {' · '}
              <a
                href={foto.origen}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-text underline underline-offset-2"
              >
                {labels.source}
              </a>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onMove(-1)}
              aria-label={labels.prev}
              className="border-line text-fg-muted hover:text-fg hover:border-line-strong focus-visible:outline-focus h-10 w-10 rounded-full border text-lg focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.92]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              aria-label={labels.next}
              className="border-line text-fg-muted hover:text-fg hover:border-line-strong focus-visible:outline-focus h-10 w-10 rounded-full border text-lg focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.92]"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
