'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import Image from 'next/image';
import { CloseIcon, FilterBar } from '@blackpink/ui';
import {
  galleryYears,
  photoAlt,
  photoCredit,
  subjectLabel,
  type GalleryPhoto,
} from '../../lib/gallery';

/**
 * ============================================================================
 * LA GALERÍA
 * ============================================================================
 * ALBAÑILERÍA CON `columns`, Y SE LLEGÓ AQUÍ DESPUÉS DE PROBAR LO OTRO.
 *
 * El primer intento fue una rejilla con `grid-row: span n`, calculando `n` a
 * partir de la proporción de cada foto. Eso conserva el orden de lectura
 * natural —izquierda a derecha, que en una galería cronológica importa—, pero
 * tiene un defecto que no se puede arreglar: el alto del hueco se calcula
 * contra un ancho de columna FIJO, y la columna mide distinto con dos, tres o
 * cuatro columnas. En cuanto el hueco y la foto no coinciden, `object-cover`
 * RECORTA.
 *
 * Y aquí recortar no es una cuestión de gusto. Nueve de las sesenta son
 * CC BY-SA, la página de créditos afirma que ninguna imagen se ha recortado, y
 * una galería cuyo trabajo es enseñar fotografías no puede decidir por su
 * cuenta qué parte de cada una sobra.
 *
 * Con `columns` cada foto conserva su proporción exacta a cualquier anchura,
 * sin recorte, sin medir nada en JavaScript y sin salto de maquetado. Se paga
 * el orden: se lee por columnas de arriba abajo en vez de por filas. Como la
 * galería trae filtro por año, quien busque una época la pide y la ve entera,
 * que era lo que el orden cronológico venía a resolver.
 *
 * LOS FILTROS SALEN DE LOS DATOS. Por integrante, de la categoría de Commons
 * de la que vino cada archivo; por año, de la fecha de la foto. No hay filtro
 * por «era» porque el catálogo no tiene eras: inventarlas sería etiquetar a
 * ojo lo que nadie ha etiquetado.
 *
 * EL CRÉDITO SE VE SIEMPRE, en la rejilla y en el lightbox, y con la licencia
 * DE CADA FOTO. Nueve de las sesenta son CC BY-SA y el resto CC BY o CC0: un
 * pie genérico sería falso para nueve. No es letra pequeña, es la condición
 * bajo la que se puede publicar la imagen.
 * ============================================================================
 */

export interface GalleryGridProps {
  photos: GalleryPhoto[];
  labels: Record<string, string>;
}

export function GalleryGrid({ photos, labels }: GalleryGridProps) {
  const [subject, setSubject] = useState('all');
  const [year, setYear] = useState('all');
  const [abierta, setAbierta] = useState<number | null>(null);

  /*
   * QUIEN ABRIO EL LIGHTBOX, GUARDADO A PROPOSITO.
   *
   * Al cerrar hay que devolver el foco al boton que lo abrio, o quien navega
   * con teclado vuelve al principio del documento y tiene que recorrer la
   * rejilla entera otra vez. Leer `document.activeElement` al montar el
   * dialogo no basta -comprobado: devolvia `body`-, porque el foco todavia no
   * ha terminado de asentarse cuando React monta.
   */
  const disparador = useRef<HTMLButtonElement | null>(null);

  const años = useMemo(() => galleryYears(photos), [photos]);

  const visibles = useMemo(
    () =>
      photos.filter(
        (foto) =>
          (subject === 'all' || foto.subject === subject) &&
          (year === 'all' || String(foto.anio) === year),
      ),
    [photos, subject, year],
  );

  const sujetos = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const foto of photos) cuenta.set(foto.subject, (cuenta.get(foto.subject) ?? 0) + 1);
    return [
      { value: 'all', label: labels.all!, count: photos.length },
      ...[...cuenta.entries()].map(([value, count]) => ({
        value,
        label: subjectLabel(value, labels.grupo!),
        count,
      })),
    ];
  }, [photos, labels]);

  const opcionesAño = useMemo(
    () => [
      { value: 'all', label: labels.allYears! },
      ...años.map((a) => ({ value: String(a), label: String(a) })),
    ],
    [años, labels],
  );

  /* ------------------------------------------------------------ lightbox --- */

  const cerrar = useCallback(() => setAbierta(null), []);
  const mover = useCallback(
    (paso: number) =>
      setAbierta((actual) => {
        if (actual === null) return null;
        // Da la vuelta por los dos extremos: en una galería, llegar al final y
        // que la flecha deje de responder se lee como que algo se ha roto.
        return (actual + paso + visibles.length) % visibles.length;
      }),
    [visibles.length],
  );

  return (
    <div>
      {/* --- Filtros ------------------------------------------------------ */}
      <div className="border-line grid gap-y-4 border-b pb-4">
        <FilterBar
          label={labels.filterSubject!}
          options={sujetos}
          value={subject}
          onChange={setSubject}
        />
        <FilterBar
          label={labels.filterYear!}
          options={opcionesAño}
          value={year}
          onChange={setYear}
        />
      </div>

      <p className="text-fg-subtle mt-4 text-xs" data-numeric aria-live="polite">
        {labels.count!.replace('{n}', String(visibles.length))}
      </p>

      {/* --- La rejilla --------------------------------------------------- */}
      <ul className="mt-block columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4">
        {visibles.map((foto, indice) => {
          return (
            /* `break-inside-avoid` impide que una foto se parta entre el pie
               de una columna y la cabeza de la siguiente. */
            <li key={foto.id} className="mb-3 break-inside-avoid sm:mb-4">
              <button
                type="button"
                onClick={(evento) => {
                  disparador.current = evento.currentTarget;
                  setAbierta(indice);
                }}
                aria-label={labels.open!.replace(
                  '{titulo}',
                  foto.tituloCommons.replace(/^File:/, ''),
                )}
                className="group/foto focus-visible:outline-focus bg-surface relative block w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Image
                  src={foto.archivo}
                  alt={photoAlt(
                    foto,
                    { conAno: labels.altYear!, sinAno: labels.alt! },
                    labels.grupo!,
                  )}
                  width={foto.width}
                  height={foto.height}
                  /*
                   * Las ocho primeras se piden con prioridad normal y el resto
                   * en diferido: son las que caben en la primera pantalla de
                   * escritorio. Marcarlas TODAS como prioritarias es hacerlas
                   * competir entre sí, que es peor que no marcar ninguna.
                   */
                  loading={indice < 8 ? 'eager' : 'lazy'}
                  sizes="(max-width: 640px) 48vw, (max-width: 768px) 46vw, (max-width: 1280px) 31vw, 23vw"
                  /* `h-auto`: la foto manda su propio alto. Nada de
                     `object-cover`, que es lo que recortaba. */
                  className="ease-out-bp block h-auto w-full transition-transform duration-[var(--dur-3)] group-hover/foto:scale-[1.03]"
                />

                {/* El crédito, sobre la foto y siempre visible. */}
                <span className="text-fg/70 text-2xs pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-2 pb-1 pt-5 tracking-normal">
                  {photoCredit(foto)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {abierta !== null && visibles[abierta] ? (
        <Lightbox
          foto={visibles[abierta]}
          posicion={abierta + 1}
          total={visibles.length}
          labels={labels}
          onClose={cerrar}
          onMove={mover}
          disparador={disparador}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------- lightbox --- */

function Lightbox({
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
    // El botón que abrió el lightbox, capturado AL ABRIR: es a él a quien hay
    // que devolver el foco, y leer la referencia al cerrar dejaría la decisión
    // a lo que valga en ese momento.
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
        // Trampa de foco: dentro del lightbox no hay nada más que recorrer.
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
      // El clic en el fondo cierra; el clic en la foto o en los controles no.
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onClose();
      }}
    >
      <div ref={panel} tabIndex={-1} className="flex h-full flex-col outline-none">
        {/* --- Barra superior --- */}
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

        {/* --- La foto --- */}
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

        {/* --- Crédito y navegación --- */}
        <div className="px-gutter flex shrink-0 flex-wrap items-end justify-between gap-4 py-5">
          <div className="min-w-0">
            {foto.descripcion ? (
              <p className="text-fg max-w-prose text-pretty text-sm">{foto.descripcion}</p>
            ) : null}
            {/*
             * La atribución completa: autor, licencia enlazada y página de
             * origen. Es lo que exigen CC BY y CC BY-SA, y va aquí y no solo
             * en /creditos porque aquí es donde se está usando la obra.
             */}
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
