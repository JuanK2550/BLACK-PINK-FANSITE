import type { Locale } from '@blackpink/types';
import { MagneticLink } from '@blackpink/ui';

export interface HeroRevealProps {
  lead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  indexLabel: string;
  scrollHint: string;
  items: { key: string; label: string; href: string }[];
  locale: Locale;
}

/**
 * ============================================================================
 * ENTRADA DE LA PORTADA
 * ============================================================================
 * Se ve UNA vez por sesión de lectura, así que puede permitirse 520 ms y un
 * escalonado: no es una interacción repetida. Las dos mitades del wordmark
 * suben con 90 ms de diferencia, que es lo que convierte dos palabras en una
 * sola marca que se arma delante del lector.
 *
 * ESTO ERA FRAMER MOTION Y SE PASÓ A CSS DESPUÉS DE MEDIRLO. Con Framer, cada
 * pieza nacía en `opacity: 0` y no se pintaba hasta que el paquete hidrataba:
 * Lighthouse marcaba este párrafo como elemento LCP con 519 ms de TTFB y
 * **5.104 ms de Render Delay**. El texto llegaba en el primer byte y el
 * navegador tenía prohibido pintarlo.
 *
 * Con CSS, el navegador pinta en cuanto tiene el HTML y la animación corre
 * sola. De paso este fichero deja de ser un componente de cliente: ya no
 * importa nada que necesite JavaScript, así que la portada entera vuelve al
 * servidor y solo los dos reclamos —que sí llevan imán— son de cliente.
 *
 * Los retardos van en línea porque son datos de composición, no un estado. El
 * del párrafo es el más corto a propósito: marca el LCP, y ahí cada
 * milisegundo de retardo es un milisegundo de LCP.
 * ============================================================================
 */
export function HeroReveal({
  lead,
  ctaPrimary,
  ctaSecondary,
  indexLabel,
  scrollHint,
  items,
  locale,
}: HeroRevealProps) {
  return (
    <>
      <h1 className="font-display text-hero font-extrabold">
        <span className="bp-hero-in text-fg block">BLACK</span>
        <span className="bp-hero-in text-accent-text block" style={{ animationDelay: '90ms' }}>
          PINK
        </span>
      </h1>

      <div
        className="bp-hero-in mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
        style={{ animationDelay: '180ms' }}
      >
        <p className="text-fg-muted max-w-[46ch] text-pretty text-lg">{lead}</p>

        {/*
         * EL CANAL DE LA DERECHA ES DE PINKY. En escritorio los dos reclamos
         * caen en la esquina inferior derecha, que es exactamente donde vive
         * la burbuja del chat -fija al viewport, z-75-: en la primera pantalla
         * tapaba el segundo boton y su globo de saludo se comia el primero.
         * 7rem despejan la burbuja y su margen sin sacar los botones de la
         * retícula. En movil no hace falta: ahi se apilan a la izquierda.
         */}
        <div className="flex shrink-0 flex-wrap gap-3 md:pe-28">
          {/* Los dos reclamos de la portada llevan imán. Van juntos, así que
              o lo llevan los dos o uno de ellos parecería estropeado. */}
          <MagneticLink href={`/${locale}/grupo`} size="lg">
            {ctaPrimary}
          </MagneticLink>
          <MagneticLink href={`/${locale}/discografia`} variant="secondary" size="lg">
            {ctaSecondary}
          </MagneticLink>
        </div>
      </div>

      {/* Sumario del número: el índice del sitio, no una fila de métricas. */}
      <nav
        aria-label={indexLabel}
        className="bp-hero-in border-line mt-12 border-t pt-4"
        style={{ animationDelay: '300ms' }}
      >
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {items.map((item) => (
            <li key={item.key}>
              {/*
               * `text-fg-muted` y no `text-fg-subtle`: medido con Lighthouse,
               * el tenue sobre el lienzo da 3.63:1 a 12px y AA pide 4.5 para
               * texto normal. El verificador del proyecto compara ese par
               * contra 3:1 —el umbral de texto grande— y por eso lo daba por
               * bueno. Aquí son enlaces de 12px: mandan los 4.5.
               */}
              <a
                href={`/${locale}${item.href}`}
                className="text-fg-muted hover:text-accent-text text-2xs ease-out-soft transition-colors duration-[var(--dur-2)]"
                data-uppercase
              >
                {item.label}
              </a>
            </li>
          ))}
          <li className="text-fg-muted text-2xs ml-auto hidden items-center gap-2 sm:flex">
            <span data-uppercase>{scrollHint}</span>
            <span aria-hidden="true" className="bg-line-strong block h-px w-10" />
          </li>
        </ul>
      </nav>
    </>
  );
}
