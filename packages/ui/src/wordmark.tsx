import { cn } from './cn';

export interface WordmarkProps {
  className?: string;
  /** 'inline' para el header, 'stacked' para la portada del hero. */
  layout?: 'inline' | 'stacked';
}

/**
 * Wordmark del sitio. Dos mitades, dos colores: la marca se construye sola.
 * Es texto real, no una imagen: escala, se selecciona, se busca y se traduce
 * a cualquier densidad de pantalla sin coste.
 */
export function Wordmark({ className, layout = 'inline' }: WordmarkProps) {
  return (
    <span
      className={cn(
        'font-display select-none font-extrabold leading-none tracking-[-0.045em]',
        layout === 'stacked' && 'flex flex-col',
        className,
      )}
    >
      <span className="text-fg">BLACK</span>
      <span className="text-accent-text">PINK</span>
    </span>
  );
}
