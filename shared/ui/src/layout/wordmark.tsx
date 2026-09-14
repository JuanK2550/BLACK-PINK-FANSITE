// Logotipo BLACKPINK en texto.

import { cn } from '../cn';

export interface WordmarkProps {
  className?: string;
  layout?: 'inline' | 'stacked';
}

export function Wordmark({ className, layout = 'inline' }: WordmarkProps) {
  return (
    <span
      lang="en"
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
