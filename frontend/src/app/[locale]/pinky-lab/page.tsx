// Página interna para revisar los gestos de PINKY (no indexada).

import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '../../../i18n/routing';
import { PinkyLab } from '../../../components/chat/pinky/pinky-lab';

export const metadata: Metadata = {
  title: 'PINKY · laboratorio',
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function PinkyLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PinkyLab />;
}
