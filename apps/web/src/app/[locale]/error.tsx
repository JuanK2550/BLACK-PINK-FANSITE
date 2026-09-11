'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Container, StateMessage } from '@blackpink/ui';

/**
 * ============================================================================
 * ERROR DE RUTA (500)
 * ============================================================================
 * Next monta este componente cuando una pagina lanza durante el renderizado.
 * Tiene que ser de cliente y recibe `reset`, que vuelve a intentar el render
 * sin recargar la pagina entera: es la reparacion mas barata y la primera que
 * hay que ofrecer.
 *
 * `digest` es el unico dato tecnico que Next expone en produccion (un hash del
 * error real, que se queda en el servidor). Se muestra plegado porque es
 * exactamente lo que hay que citar al reportar el fallo.
 *
 * Vive DENTRO de [locale], asi que el proveedor de traducciones sigue montado
 * y el mensaje sale en el idioma que el visitante estaba leyendo. Un error en
 * espanol en mitad de una sesion en coreano es un segundo fallo encima del
 * primero.
 * ============================================================================
 */
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
    // En el navegador esto queda en la consola; en el servidor ya lo ha
    // registrado Next. No se envia a ningun servicio de terceros.
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
