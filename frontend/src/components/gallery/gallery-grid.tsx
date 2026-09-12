// Rejilla de fotos con filtros y visor a pantalla completa.
'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { FilterBar } from '@blackpink/ui';
import {
  galleryYears,
  photoAlt,
  photoCredit,
  subjectLabel,
  type GalleryPhoto,
} from '../../lib/gallery';
import { Lightbox } from './lightbox';

export interface GalleryGridProps {
  photos: GalleryPhoto[];
  labels: Record<string, string>;
}

export function GalleryGrid({ photos, labels }: GalleryGridProps) {
  const [subject, setSubject] = useState('all');
  const [year, setYear] = useState('all');
  const [abierta, setAbierta] = useState<number | null>(null);

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

  const cerrar = useCallback(() => setAbierta(null), []);
  const mover = useCallback(
    (paso: number) =>
      setAbierta((actual) => {
        if (actual === null) return null;
        return (actual + paso + visibles.length) % visibles.length;
      }),
    [visibles.length],
  );

  return (
    <div>
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

      <ul className="mt-block columns-2 gap-3 sm:gap-4 md:columns-3 xl:columns-4">
        {visibles.map((foto, indice) => {
          return (
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
                  loading={indice < 8 ? 'eager' : 'lazy'}
                  sizes="(max-width: 640px) 48vw, (max-width: 768px) 46vw, (max-width: 1280px) 31vw, 23vw"
                  className="ease-out-bp block h-auto w-full transition-transform duration-[var(--dur-3)] group-hover/foto:scale-[1.03]"
                />

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
