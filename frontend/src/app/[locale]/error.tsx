// Pantalla de error de una página.
'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Container, StateMessage } from '@blackpink/ui';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations('Errors');

  useEffect(() => {
    console.error('Error de ruta:', error);
  }, [error]);

  return (
    <Container width="wide" className="py-section">
      <StateMessage
        title={t('crashTitle')}
        description={t('crashDescription')}
        action={{ label: t('retry'), onClick: reset }}
        secondary={{ label: t('backHome'), href: `/${locale}` }}
        detail={error.digest ? { label: t('detailLabel'), value: error.digest } : undefined}
      />
    </Container>
  );
}
