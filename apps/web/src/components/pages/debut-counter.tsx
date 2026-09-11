'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@blackpink/types';
import { Container, CountUp } from '@blackpink/ui';
import { formatDate, formatNumber } from '../../lib/format';
import { daysSince, msUntilNextUtcMidnight, yearsSince } from '../../lib/debut';

/**
 * ============================================================================
 * CUÁNTO LLEVA EL GRUPO, EN VIVO
 * ============================================================================
 * Dos cifras —días desde el debut y años de trayectoria— que suben desde cero
 * al entrar en pantalla.
 *
 * LA FECHA NO ESTÁ ESCRITA AQUÍ. Llega desde el hito de categoría `DEBUT` de
 * la cronología, que es un dato contrastado del catálogo con su `source`. Es
 * la misma regla que rige en todo el sitio: una fecha escrita a mano en un
 * componente es una fecha que nadie puede contrastar y que se queda vieja sin
 * que salte ninguna alarma.
 *
 * LAS CIFRAS INICIALES LAS CALCULA EL SERVIDOR y llegan como props. Podrían
 * calcularse aquí en el primer render, pero entonces el HTML del servidor y
 * la primera pintura del navegador saldrían de dos relojes distintos y React
 * avisaría de un desajuste de hidratación. Con las props, la primera pintura
 * es idéntica por construcción y el navegador corrige después.
 *
 * QUÉ SIGNIFICA «EN VIVO». Los días cambian una vez al día, así que no hay
 * intervalo de un segundo: se programa un único temporizador a la próxima
 * medianoche UTC y a partir de ahí uno diario. Repintar la misma cifra
 * ochenta y seis mil veces al día no la haría más viva, solo más cara.
 *
 * La página es estática con revalidación horaria, así que la cifra del HTML
 * puede tener hasta una hora: para una cuenta de DÍAS eso solo se nota en la
 * hora siguiente a la medianoche UTC, y el navegador la corrige al montar.
 * ============================================================================
 */

export interface DebutCounterProps {
  /** Fecha del hito `DEBUT`, en formato `YYYY-MM-DD`. */
  debutDate: string;
  /** Días calculados en el servidor. Sostienen la primera pintura. */
  initialDays: number;
  /** Años calculados en el servidor. */
  initialYears: number;
  locale: Locale;
  labels: { days: string; years: string; since: string };
}

export function DebutCounter({
  debutDate,
  initialDays,
  initialYears,
  locale,
  labels,
}: DebutCounterProps) {
  const [counts, setCounts] = useState({ days: initialDays, years: initialYears });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const refresh = () => {
      const now = Date.now();
      setCounts({ days: daysSince(debutDate, now), years: yearsSince(debutDate, now) });
      // Se vuelve a programar contra el reloj, no con un intervalo fijo: un
      // temporizador que llega tarde no desplaza todos los siguientes.
      timer = setTimeout(refresh, msUntilNextUtcMidnight(Date.now()) + 1000);
    };

    refresh();
    return () => clearTimeout(timer);
  }, [debutDate]);

  const format = (value: number) => formatNumber(value, locale);

  return (
    <Container width="wide">
      {/*
       * ACOTADA A 896px. A lo ancho de 1600, las dos cifras quedaban a 700px
       * una de otra: dejaban de leerse como una frase —«3.681 días, 10
       * años»— y pasaban a parecer dos datos sin relación en dos extremos de
       * la pantalla. Juntas, la segunda explica a la primera.
       */}
      <div className="border-line grid max-w-4xl border-y sm:grid-cols-2">
        {/*
         * El rosa va SOLO en los días. Es la cifra que cambia y la que
         * sorprende; los años son contexto. Dos números grandes en acento,
         * uno al lado del otro, dejarían de señalar nada, que es exactamente
         * lo que el sistema pide evitar.
         */}
        <Figure
          value={counts.days}
          format={format}
          label={labels.days}
          className="text-accent-text"
          containerClassName="py-block sm:pr-10"
        />
        <Figure
          value={counts.years}
          format={format}
          label={labels.years}
          className="text-fg"
          containerClassName="border-line py-block border-t sm:border-l sm:border-t-0 sm:pl-10"
        />
      </div>

      {/* De dónde salen las dos cifras. Un número sin su origen es una
          afirmación; con la fecha delante es una cuenta que cualquiera puede
          repetir. */}
      <p className="text-fg-subtle mt-4 text-xs">
        {labels.since}{' '}
        <time dateTime={debutDate} data-numeric>
          {formatDate(debutDate, locale)}
        </time>
      </p>
    </Container>
  );
}

function Figure({
  value,
  format,
  label,
  className,
  containerClassName,
}: {
  value: number;
  format: (value: number) => string;
  label: string;
  className: string;
  containerClassName: string;
}) {
  return (
    <div className={containerClassName}>
      <p className={`font-display text-6xl font-extrabold sm:text-7xl ${className}`}>
        <CountUp value={value} format={format} />
      </p>
      <p className="text-fg-subtle text-2xs mt-3" data-uppercase>
        {label}
      </p>
    </div>
  );
}
