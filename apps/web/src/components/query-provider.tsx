'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * ============================================================================
 * TANSTACK QUERY
 * ============================================================================
 * SOLO para lo interactivo del cliente. Hoy eso es una única cosa: el
 * buscador, que consulta en cada tecla y necesita cancelación, deduplicación y
 * memoria de lo ya consultado.
 *
 * Todo lo demás (integrantes, discografía, cronología, curiosidades) se carga
 * en Server Components con revalidación ISR. Meterlo también en Query
 * significaría enviar al navegador un cliente de datos, un caché y los propios
 * datos serializados, para pintar lo mismo que ya llegó como HTML.
 *
 * El cliente se crea con `useState` y no como constante de módulo: en el
 * servidor un módulo se comparte entre peticiones, y un caché compartido entre
 * visitantes es una fuga de datos entre personas.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // El contenido apenas cambia: no tiene sentido revalidar al
            // volver a la pestaña ni al recuperar la conexión.
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
