// Bloques de carga.

import { cn } from '../cn';

export interface SkeletonProps {
  className?: string;
  width?: string;
}

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
  lines?: number;
  className?: string;
}

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
  label: string;
  className?: string;
}

export function LoadingRegion({ children, label, className }: LoadingRegionProps) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
