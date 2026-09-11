import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { Container, SectionHeading, StateMessage } from '@blackpink/ui';

/**
 * Marco comun de las secciones de la home.
 *
 * Vive aqui y no repetido en cada seccion para que el filete, el ritmo
 * vertical y el ancla de scroll no puedan divergir entre unas y otras.
 */
export function SectionFrame({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={id} className="py-section scroll-mt-24">
      <Container width="wide">{children}</Container>
    </section>
  );
}

/**
 * Fallo de UNA seccion, con el resto de la pagina intacta.
 *
 * Es la diferencia entre "la cronologia no ha cargado" y "el sitio esta roto".
 * Como cada seccion es su propio limite de Suspense y de error, la caida de un
 * endpoint no se lleva por delante la pagina entera.
 */
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
