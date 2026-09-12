// Marco común de las secciones del inicio.

import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { Container, SectionHeading, StateMessage } from '@blackpink/ui';

export function SectionFrame({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={id} className="py-section scroll-mt-24">
      <Container width="wide">{children}</Container>
    </section>
  );
}

export async function SectionError({
  locale,
  heading,
  detail,
}: {
  locale: Locale;
  heading: string;
  detail?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'Errors' });

  return (
    <>
      <SectionHeading title={heading} hideRule />
      <StateMessage
        className="mt-block"
        title={t('sectionTitle')}
        description={t('sectionDescription')}
        detail={detail ? { label: t('detailLabel'), value: detail } : undefined}
      />
    </>
  );
}
