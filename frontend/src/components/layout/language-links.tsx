// Enlaces reales a la misma página en los otros idiomas.
'use client';

import { useLocale } from 'next-intl';
import type { Locale } from '@blackpink/types';
import { SUPPORTED_LOCALES } from '@blackpink/types';
import { Link, usePathname } from '../../i18n/routing';

const NOMBRES: Record<Locale, string> = { es: 'Español', en: 'English', ko: '한국어' };

export function LanguageLinks({ label }: { label: string }) {
  const actual = useLocale() as Locale;
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="text-fg-subtle text-2xs" data-uppercase>
        {label}
      </span>

      {SUPPORTED_LOCALES.map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          hrefLang={code}
          lang={code}
          aria-current={code === actual ? 'page' : undefined}
          className={[
            'focus-visible:outline-focus ease-out-soft text-xs transition-colors duration-[var(--dur-2)] focus-visible:outline-2',
            code === actual ? 'text-fg' : 'text-fg-subtle hover:text-accent-text',
          ].join(' ')}
        >
          {NOMBRES[code]}
        </Link>
      ))}
    </nav>
  );
}
