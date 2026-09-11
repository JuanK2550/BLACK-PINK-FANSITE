import type { Locale } from '@blackpink/types';
import { cn } from './cn';

/**
 * Aviso legal obligatorio del sitio. Debe estar visible en todas las paginas:
 * es un sitio de fans no oficial, sin afiliacion con YG Entertainment ni
 * BLACKPINK. No es letra pequena: va arriba del todo y se repite en el pie.
 */
const DISCLAIMER: Record<Locale, string> = {
  es: 'Sitio de fans no oficial. No afiliado a YG Entertainment ni a BLACKPINK.',
  en: 'Unofficial fan site. Not affiliated with YG Entertainment or BLACKPINK.',
  ko: '비공식 팬 사이트입니다. YG 엔터테인먼트 및 BLACKPINK와 제휴 관계가 없습니다.',
};

export interface DisclaimerBannerProps {
  locale?: Locale;
  className?: string;
}

export function DisclaimerBanner({ locale = 'es', className }: DisclaimerBannerProps) {
  return (
    <div
      role="note"
      lang={locale}
      className={cn(
        'bg-surface border-line text-fg-muted text-2xs border-b px-4 py-2 text-center',
        className,
      )}
    >
      <span className="bg-accent mr-2 inline-block h-1 w-1 translate-y-[-0.15em] rounded-full align-middle" />
      {DISCLAIMER[locale]}
    </div>
  );
}

export { DISCLAIMER };
