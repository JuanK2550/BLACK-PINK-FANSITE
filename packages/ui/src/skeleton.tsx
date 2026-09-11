import { cn } from './cn';

export interface SkeletonProps {
  className?: string;
  /** Ancho relativo, para que las líneas de un párrafo no midan todas igual. */
  width?: string;
}

/**
 * Pieza de carga.
 *
 * TRES DECISIONES:
 *
 * 1. NO PULSA CON OPACIDAD. El latido clásico (opacity 0.4 -> 1) parpadea y
 *    en una rejilla de doce piezas produce una pantalla que vibra. Aquí se
 *    desplaza un brillo con `translate3d`, que va a GPU y se lee como una
 *    superficie en preparación, no como un error intermitente.
 *
 * 2. RESPETA LAS FORMAS DEL SISTEMA. Radio 0, igual que las superficies
 *    editoriales que sustituye. Un esqueleto redondeado sobre una interfaz de
 *    esquinas rectas delata que es una pieza prestada de otro sitio.
 *
 * 3. ES INVISIBLE PARA LA ASISTENCIA. `aria-hidden` en cada pieza; quien
 *    anuncia la espera es el contenedor, una sola vez, en vez de leer treinta
 *    cajas vacías.
 */
export function Skeleton({ className, width }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      style={width ? { width } : undefined}
      className={cn('bp-skeleton bg-surface block h-4 w-full', className)}
    />
  );
}

export interface SkeletonTextProps {
  /** Número de líneas. */
  lines?: number;
  className?: string;
}

/** Bloque de texto en carga. La última línea es más corta, como un párrafo real. */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const widths = ['100%', '92%', '96%', '88%'];

  return (
    <span className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className="h-3.5"
          width={index === lines - 1 ? '64%' : widths[index % widths.length]}
        />
      ))}
    </span>
  );
}

export interface LoadingRegionProps {
  children: React.ReactNode;
  /** Lo que se anuncia mientras carga. Una vez, no por pieza. */
  label: string;
  className?: string;
}

/**
 * Envuelve un bloque en carga y lo anuncia a los lectores de pantalla.
 *
 * `aria-busy` con `role="status"` y `aria-live="polite"`: se avisa sin
 * interrumpir lo que el visitante esté leyendo.
 */
export function LoadingRegion({ children, label, className }: LoadingRegionProps) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
