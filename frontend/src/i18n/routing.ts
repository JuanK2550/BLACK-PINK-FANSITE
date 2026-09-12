// Idiomas y rutas con prefijo.

import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@blackpink/types';

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: true,
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
