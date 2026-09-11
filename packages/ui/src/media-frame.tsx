import type { ReactNode } from 'react';
import { cn } from './cn';
import { ImageIcon } from './icons';

export type MediaRatio = 'portrait' | 'square' | 'wide' | 'cover';

const RATIOS: Record<MediaRatio, string> = {
  portrait: 'aspect-[3/4]',
  square: 'aspect-square',
  wide: 'aspect-[16/9]',
  cover: 'aspect-[4/5]',
};

export interface MediaFrameProps {
  ratio?: MediaRatio;
  /** Texto grande de relleno: una inicial, un numero de pista, un ano. */
  glyph?: string;
  /** Etiqueta pequena bajo el icono. Describe que imagen falta. */
  label?: string;
  /**
   * Acerca el contenido cuando se pasa el raton por el ancestro marcado
   * con la clase `group/card`. El marco no se mueve: se mueve lo de dentro.
   */
  zoom?: boolean;
  /** La imagen real cuando exista. Si llega, el relleno no se pinta. */
  children?: ReactNode;
  className?: string;
}

/**
 * Marco de imagen del sitio.
 *
 * El proyecto no aloja material con copyright, asi que por defecto pinta un
 * relleno propio en vez de una foto. En cuanto se le pasa una imagen real
 * como children, el relleno desaparece sin tocar el maquetado: el hueco, el
 * recorte y la proporcion ya estan resueltos aqui.
 *
 * Radio 0 a proposito: en este sistema las superficies editoriales son rectas
 * y solo lo que se pulsa lleva esquina redondeada.
 */
export function MediaFrame({
  ratio = 'portrait',
  glyph,
  label,
  zoom = false,
  children,
  className,
}: MediaFrameProps) {
  return (
    <div
      className={cn(
        '@container bg-surface shadow-hairline relative isolate overflow-hidden',
        RATIOS[ratio],
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-0',
          zoom && 'ease-out-bp transition-transform duration-[280ms] group-hover/card:scale-[1.04]',
        )}
      >
        {children ?? (
          <div
            className="grid h-full w-full place-items-center"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, var(--color-accent-tint) 0 1px, transparent 1px 9px)',
            }}
          >
            {glyph ? (
              <span
                aria-hidden="true"
                className="font-display text-fg/8 select-none text-[26cqw] font-extrabold leading-none"
              >
                {glyph}
              </span>
            ) : null}
            {label ? (
              <span className="text-fg-subtle text-2xs absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                {/* Los iconos miden 1em: el escalon de la escala es el que
                    fija su tamano. Un poco mayor que la etiqueta para que el
                    par icono+texto se lea alineado y no aplastado. */}
                <ImageIcon className="text-sm" />
                <span data-uppercase>{label}</span>
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
