import type { ReactNode } from 'react';
import { buttonStyles } from './button';
import { cn } from './cn';
import { ArrowRightIcon } from './icons';

export interface StateMessageProps {
  title: string;
  description: string;
  /** Acción principal: recargar, volver, reintentar. */
  action?: { label: string; href?: string; onClick?: () => void };
  /** Enlace secundario, sin peso visual. */
  secondary?: { label: string; href: string };
  /**
   * Detalle técnico plegado. Solo para errores, nunca visible de entrada.
   * `label` es la cadena visible del resumen y la pone quien llama: toda
   * cadena visible del sitio tiene que poder traducirse.
   */
  detail?: { label: string; value: string };
  children?: ReactNode;
  className?: string;
}

/**
 * Mensaje de estado: error, vacío o resultado sin coincidencias.
 *
 * SIN ILUSTRACIÓN Y SIN ICONO GRANDE. Un dibujo triste no arregla nada y
 * empuja hacia abajo lo único que el visitante necesita: qué ha pasado y qué
 * puede hacer ahora. La jerarquía la lleva el titular, como en el resto del
 * sitio, y el filete superior lo ancla al mismo ritmo editorial que las
 * secciones de contenido.
 *
 * El texto lo pone quien llama: aquí no hay cadenas escritas a mano, porque
 * toda cadena visible del sitio tiene que poder traducirse.
 */
export function StateMessage({
  title,
  description,
  action,
  secondary,
  detail,
  children,
  className,
}: StateMessageProps) {
  return (
    <div className={cn('border-line border-t pt-8', className)}>
      <h2 className="font-display text-fg text-balance text-3xl font-extrabold">{title}</h2>
      <p className="text-fg-muted mt-3 max-w-prose text-pretty text-base">{description}</p>

      {children}

      {(action ?? secondary) ? (
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          {action?.href ? (
            <a href={action.href} className={buttonStyles({ size: 'md' })}>
              {action.label}
            </a>
          ) : action?.onClick ? (
            <button type="button" onClick={action.onClick} className={buttonStyles({ size: 'md' })}>
              {action.label}
            </button>
          ) : null}

          {secondary ? (
            <a
              href={secondary.href}
              className="group/link text-fg-muted hover:text-accent-text ease-out-soft focus-visible:outline-focus inline-flex items-center gap-2 text-sm transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {secondary.label}
              <ArrowRightIcon className="ease-out-bp transition-transform duration-[var(--dur-2)] group-hover/link:translate-x-1" />
            </a>
          ) : null}
        </div>
      ) : null}

      {detail ? (
        /*
         * El detalle técnico va plegado, no oculto.
         * Enseñárselo de entrada a quien solo quiere ver una discografía es
         * ruido; escondérselo a quien viene a reportar el fallo le obliga a
         * abrir la consola. Un <details> resuelve las dos cosas.
         */
        <details className="group/detail mt-8">
          <summary className="text-fg-subtle hover:text-fg-muted focus-visible:outline-focus text-2xs ease-out-soft w-fit cursor-pointer list-none transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4">
            <span data-uppercase>{detail.label}</span>
          </summary>
          <p className="text-fg-subtle border-line mt-3 break-words border-l pl-4 font-mono text-xs">
            {detail.value}
          </p>
        </details>
      ) : null}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  className?: string;
}

/** Sin resultados. No es un error: no lleva acción ni tono de disculpa. */
export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('border-line border-t py-12', className)}>
      <p className="font-display text-fg text-xl font-bold">{title}</p>
      <p className="text-fg-muted mt-2 max-w-prose text-pretty text-sm">{description}</p>
    </div>
  );
}
