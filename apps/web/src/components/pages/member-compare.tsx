'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { Locale, MemberDetail } from '@blackpink/types';
import { FilterBar, SwapIcon, VisuallyHidden } from '@blackpink/ui';
import { MemberPhoto } from '../member-photo';
import { formatDate, formatNumber } from '../../lib/format';

/**
 * ============================================================================
 * COMPARADOR DE INTEGRANTES
 * ============================================================================
 * Dos columnas, los mismos campos en las dos, y una animación cuando cambia
 * la selección.
 *
 * POR QUÉ ESTO TIENE RUTA PROPIA y no vive en `/integrantes`: allí un clic
 * sobre un retrato significa «ir a su ficha». Un comparador le daría al mismo
 * retrato un segundo significado —«ponla en la columna A»— y dos significados
 * para el mismo gesto es la forma más rápida de que una página se vuelva
 * confusa. Además, una comparación es una RESPUESTA, y una respuesta merece
 * dirección propia: con `?a=jisoo&b=rose` en la URL, «¿quién es mayor?» se
 * puede enlazar, compartir e indexar.
 *
 * SOLO SE ANIMA LA COLUMNA QUE CAMBIA. Cada celda lleva como `key` el slug de
 * su integrante: al cambiar solo un lado, React solo remonta ese lado y la
 * animación cuenta la verdad de lo que ha pasado. Con una `key` en la tabla
 * entera, cambiar una columna haría parpadear las dos y el movimiento
 * describiría algo que no ocurrió.
 *
 * LA ANIMACIÓN ES CSS, NO FRAMER MOTION. Es un gesto predeterminado que corre
 * fuera del hilo principal; Framer aquí no aporta nada y sí obliga a montar
 * un `AnimatePresence` para algo que una `key` y una clase resuelven. El
 * desenfoque de 4px que acompaña al desplazamiento no es adorno: durante un
 * fundido cruzado se ven dos textos superpuestos, y el desenfoque los funde
 * en uno solo.
 *
 * ELEGIR NO ES COMPROMETERSE, así que los selectores SON grupos de radio
 * —al revés que las opciones del quiz, donde pulsar es responder y por eso
 * son botones—. Se reutiliza `FilterBar`, que ya es un `radiogroup` con
 * navegación por flechas y subrayado compartido.
 *
 * ELEGIR LA QUE YA ESTÁ EN LA OTRA COLUMNA NO SE BLOQUEA: las intercambia.
 * Un control deshabilitado obliga a entender por qué antes de poder actuar;
 * el intercambio hace lo único que esa elección puede querer decir.
 *
 * CADA VALOR LLEVA EL NOMBRE DE SU INTEGRANTE PARA EL LECTOR DE PANTALLA.
 * Una comparación en la que no se sabe de quién es cada dato no es una
 * comparación. En pantalla el nombre está en la cabecera de la columna; sin
 * verla, «Nombre real: Kim Ji-soo, Roseanne Park» no dice cuál es cuál, así
 * que el nombre se repite oculto en cada celda.
 * ============================================================================
 */

export interface MemberCompareProps {
  members: MemberDetail[];
  locale: Locale;
  initialA: string;
  initialB: string;
  labels: Record<string, string>;
  /** Ruta a /creditos ya con su prefijo de idioma. */
  creditsHref: string;
}

/** Sustituye `{clave}` por su valor. Las cadenas vienen de next-intl en crudo. */
function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

interface Row {
  key: string;
  label: string;
  /** `null` = esta integrante no tiene ese dato. */
  values: [ReactNode | null, ReactNode | null];
  lang?: string;
}

const DAY_MS = 86_400_000;

export function MemberCompare({
  members,
  locale,
  initialA,
  initialB,
  labels,
  creditsHref,
}: MemberCompareProps) {
  const [slugs, setSlugs] = useState<[string, string]>([initialA, initialB]);

  const a = members.find((member) => member.slug === slugs[0]) ?? members[0]!;
  const b = members.find((member) => member.slug === slugs[1]) ?? members[1]!;

  /*
   * La URL se actualiza con `replaceState` y no con el router: aquí no hay
   * nada nuevo que pedir al servidor —las cuatro fichas ya están en la
   * página— y una navegación costaría una vuelta entera para volver a pintar
   * lo mismo. Con `replaceState` la dirección queda compartible al instante y
   * el historial no se llena de una entrada por cada clic.
   */
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('a', a.slug);
    url.searchParams.set('b', b.slug);
    window.history.replaceState(null, '', url);
  }, [a.slug, b.slug]);

  function choose(side: 0 | 1, slug: string) {
    setSlugs((current) => {
      const other = side === 0 ? 1 : 0;
      // Elegir la que ya está enfrente las intercambia.
      if (current[other] === slug) return [current[1], current[0]];
      const next: [string, string] = [current[0], current[1]];
      next[side] = slug;
      return next;
    });
  }

  function swap() {
    setSlugs((current) => [current[1], current[0]]);
  }

  const options = useMemo(
    () => members.map((member) => ({ value: member.slug, label: member.stageName })),
    [members],
  );

  const rows = useMemo(() => buildRows(a, b, locale, labels), [a, b, locale, labels]);
  const gap = ageGapSentence(a, b, locale, labels);

  return (
    <div>
      {/* --- Los dos selectores ------------------------------------------- */}
      <div className="border-line grid gap-x-4 gap-y-6 border-b pb-6 sm:grid-cols-2 sm:gap-x-10">
        <div>
          <p className="text-fg-subtle text-2xs mb-2" data-uppercase>
            {labels.slotA}
          </p>
          {/* `bleed={false}`: dentro de una columna, el desbordamiento al
              canal lateral se metería en la columna vecina. */}
          <FilterBar
            bleed={false}
            label={labels.slotA!}
            options={options}
            value={a.slug}
            onChange={(value) => choose(0, value)}
          />
        </div>

        <div className="relative">
          <p className="text-fg-subtle text-2xs mb-2" data-uppercase>
            {labels.slotB}
          </p>
          <FilterBar
            bleed={false}
            label={labels.slotB!}
            options={options}
            value={b.slug}
            onChange={(value) => choose(1, value)}
          />

          {/*
           * El intercambio es un atajo: se puede conseguir lo mismo eligiendo
           * a mano en los dos lados. Por eso va en discreto y no como botón
           * principal, y por eso su nombre solo lo oye quien no lo ve.
           *
           * `title` además del nombre oculto: un botón de solo icono no dice
           * qué hace hasta que se pulsa, y con el ratón un rótulo al pasar por
           * encima es la única forma de averiguarlo sin arriesgarse.
           *
           * 40px de lado, no 32: es el mínimo cómodo para un dedo, y en móvil
           * este botón cae justo encima de las fichas.
           */}
          <button
            type="button"
            onClick={swap}
            title={labels.swap}
            className="text-fg-subtle hover:text-accent-text focus-visible:outline-focus ease-out-soft absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full text-lg transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.92] active:duration-[var(--dur-1)]"
          >
            <SwapIcon />
            <VisuallyHidden>{labels.swap}</VisuallyHidden>
          </button>
        </div>
      </div>

      {/* --- Las dos cabeceras: foto, nombre y papel ---------------------- */}
      {/*
       * LA FOTO AQUÍ IDENTIFICA, NO PROTAGONIZA, y por eso es un cuadrado
       * pequeño y no el retrato 3:4 de la ficha.
       *
       * Con el retrato a media columna medía 573px de alto: dos de esos
       * empujaban la tabla entera por debajo del borde inferior, y una
       * comparación en la que no se ve ni un dato comparado sin desplazarse
       * ha fallado en lo único que tenía que hacer. A 112px la cara se
       * reconoce igual y la primera fila entra en pantalla.
       */}
      <div className="mt-block grid grid-cols-2 gap-x-4 sm:gap-x-10">
        {[a, b].map((member) => (
          <div key={member.slug} className="bp-compare-in" style={cellDelay(0)}>
            {/*
             * `hideCredit`, y la atribución se resuelve con el enlace a
             * /creditos que hay debajo. Es exactamente lo que ya se hizo en
             * el mega-menú: a 112px, la línea «© autor · CC BY 3.0» sale
             * cortada, y un crédito ilegible no cumple la licencia mejor que
             * un enlace que sí se lee. La propia CC BY admite esa forma
             * cuando el medio no da espacio.
             */}
            <div className="w-28">
              {/*
               * SIGUE SIENDO EL MARCO 3:4 aunque sea pequeño. En cuadrado el
               * recorte salía mal: `imageFocus` dice dónde cae la cara EN UN
               * MARCO 3:4 —es una propiedad de la foto, calculada para esa
               * proporción— y al pasar a 1:1 dejaba de apuntar donde debía.
               * Cambiar la proporción sin cambiar el foco es tirar el dato.
               *
               * Nunca pasa de 112px de ancho, así que se pide eso y no un
               * porcentaje de la pantalla.
               */}
              <MemberPhoto member={member} sizes="112px" hideCredit />
            </div>
            {/* A `text-3xl` el nombre medía 48px al lado de una foto de 112:
                el rótulo aplastaba a la imagen que tenía que identificarlo. */}
            <p className="font-display text-fg mt-4 text-xl font-bold sm:text-2xl">
              {member.stageName}
            </p>
            {/* `bp-member-ink` mezcla el color propio con la tinta del tema:
                tal cual, el lila de Jisoo da 1.3:1 sobre el papel del modo
                BLINK. Ver la nota en `packages/ui/src/styles.css`. */}
            <p
              className="bp-member-ink mt-1 text-sm"
              style={{ '--bp-member': member.colorAccent ?? undefined } as CSSProperties}
            >
              {member.position}
            </p>
          </div>
        ))}
      </div>

      {/* --- La tabla ----------------------------------------------------- */}
      <dl className="mt-block">
        {rows.map((row, index) => (
          /*
           * La etiqueta va ENCIMA del par y no en una tercera columna a la
           * izquierda. A 375px, tres columnas dejan cada valor en una ranura
           * de cien píxeles; con la etiqueta arriba, la comparación conserva
           * sus dos columnas en cualquier anchura, que es lo único que una
           * comparación no puede perder.
           */
          <div
            key={row.key}
            className="border-line grid grid-cols-2 gap-x-4 border-t pb-4 pt-4 first:border-t-0 sm:gap-x-10"
          >
            <dt className="text-fg-subtle text-2xs col-span-2 mb-1" data-uppercase>
              {row.label}
            </dt>

            {row.values.map((value, side) => {
              const member = side === 0 ? a : b;
              return (
                <dd
                  key={member.slug}
                  lang={row.lang}
                  style={cellDelay(index + 1)}
                  className={[
                    'bp-compare-in text-pretty text-sm sm:text-base',
                    // El filete vertical solo cruza los valores: separa una
                    // columna de otra sin llegar a dibujar una caja.
                    side === 1 ? 'border-line border-l pl-4 sm:pl-10' : '',
                    value === null ? 'text-fg-subtle' : 'text-fg',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <VisuallyHidden>{member.stageName}: </VisuallyHidden>
                  {/* Un dato que falta en UN lado se marca con una raya: la
                      fila tiene que existir para que las dos columnas sigan
                      alineadas. Si falta en los dos, la fila no se pinta. */}
                  {value ?? '—'}
                </dd>
              );
            })}
          </div>
        ))}
      </dl>

      {/*
       * La diferencia de edad es lo único que este comparador calcula, y no es
       * un juicio: es una resta entre dos fechas contrastadas. Va en texto y
       * una sola vez, no como marca de «ganadora» en la fila —una tabla que
       * corona vencedoras convierte a cuatro personas en una clasificación—.
       */}
      {gap ? (
        <p
          key={`${a.slug}-${b.slug}`}
          className="bp-compare-in border-line text-fg-muted mt-2 text-pretty border-t pt-6 text-sm"
        >
          {gap}
        </p>
      ) : null}

      {/*
       * La atribución de las dos fotos. No es letra pequeña opcional: es la
       * condición de la licencia CC BY, y aquí sustituye al crédito
       * superpuesto porque a 112px ese crédito no se lee.
       */}
      <p className="text-fg-subtle mt-6 text-xs">
        <a
          href={creditsHref}
          className="hover:text-accent-text focus-visible:outline-focus ease-out-soft underline underline-offset-4 transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {labels.photoCredits}
        </a>
      </p>
    </div>
  );
}

/** Escalonado corto: el gesto tiene que leerse como uno, no como una lista. */
function cellDelay(index: number) {
  return { animationDelay: `${Math.min(index, 6) * 40}ms` };
}

function firstSoloWork(member: MemberDetail) {
  return [...member.soloWorks].sort((x, y) => x.releaseDate.localeCompare(y.releaseDate))[0];
}

function buildRows(
  a: MemberDetail,
  b: MemberDetail,
  locale: Locale,
  labels: Record<string, string>,
): Row[] {
  const soloA = firstSoloWork(a);
  const soloB = firstSoloWork(b);

  const rows: Row[] = [
    { key: 'realName', label: labels.realName!, values: [a.fullName, b.fullName] },
    {
      key: 'koreanName',
      label: labels.koreanName!,
      values: [a.koreanName, b.koreanName],
      lang: 'ko',
    },
    {
      key: 'birthDate',
      label: labels.birthDate!,
      values: [
        a.birthDate ? <Day key="a" date={a.birthDate} locale={locale} /> : null,
        b.birthDate ? <Day key="b" date={b.birthDate} locale={locale} /> : null,
      ],
    },
    { key: 'nationality', label: labels.nationality!, values: [a.nationality, b.nationality] },
    /*
     * NO HAY FILA DE «PAPEL EN EL GRUPO»: ya está en la cabecera de cada
     * columna, con el color propio de cada integrante, cien píxeles más
     * arriba. Repetirlo en la tabla es decir dos veces lo mismo en la misma
     * pantalla, y una tabla de comparación se lee peor cuanto más larga es.
     */
    {
      key: 'soloCount',
      label: labels.soloCount!,
      values: [
        <span key="a" data-numeric>
          {formatNumber(a.soloWorks.length, locale)}
        </span>,
        <span key="b" data-numeric>
          {formatNumber(b.soloWorks.length, locale)}
        </span>,
      ],
    },
    {
      key: 'firstSolo',
      label: labels.firstSolo!,
      values: [
        soloA ? (
          <Work key="a" title={soloA.title} date={soloA.releaseDate} locale={locale} />
        ) : null,
        soloB ? (
          <Work key="b" title={soloB.title} date={soloB.releaseDate} locale={locale} />
        ) : null,
      ],
    },
  ];

  // Una fila vacía en las dos columnas no informa de nada: se retira entera.
  return rows.filter((row) => row.values[0] !== null || row.values[1] !== null);
}

function Day({ date, locale }: { date: string; locale: Locale }) {
  return (
    <time dateTime={date} data-numeric>
      {formatDate(date, locale)}
    </time>
  );
}

function Work({ title, date, locale }: { title: string; date: string; locale: Locale }) {
  return (
    <>
      {title}
      <span className="text-fg-subtle">
        {' · '}
        <time dateTime={date} data-numeric>
          {formatDate(date, locale, 'year')}
        </time>
      </span>
    </>
  );
}

/**
 * «JISOO es 1.135 días mayor que ROSÉ».
 *
 * Nada si falta una fecha o si es la misma persona en los dos lados. El
 * singular tiene su propia cadena: «1 días» delata una plantilla, y entre tres
 * idiomas no hay una regla de plural común que sirva.
 */
function ageGapSentence(
  a: MemberDetail,
  b: MemberDetail,
  locale: Locale,
  labels: Record<string, string>,
): string | null {
  if (a.slug === b.slug || !a.birthDate || !b.birthDate) return null;

  const dateA = Date.parse(`${a.birthDate}T00:00:00.000Z`);
  const dateB = Date.parse(`${b.birthDate}T00:00:00.000Z`);
  if (Number.isNaN(dateA) || Number.isNaN(dateB)) return null;

  const days = Math.round(Math.abs(dateA - dateB) / DAY_MS);
  if (days === 0) return labels.sameDay ?? null;

  const older = dateA < dateB ? a : b;
  const younger = dateA < dateB ? b : a;

  return fill(days === 1 ? labels.ageGapOne! : labels.ageGap!, {
    older: older.stageName,
    younger: younger.stageName,
    days: formatNumber(days, locale),
  });
}
