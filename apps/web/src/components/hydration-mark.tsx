'use client';

import { useEffect } from 'react';

/**
 * ============================================================================
 * MARCA DE HIDRATACION
 * ============================================================================
 * Pone `data-hydrated` en `<html>` cuando React ha tomado la pagina.
 *
 * ES UN GANCHO PARA LOS E2E, y se dice sin rodeos. Playwright necesitaba saber
 * cuando un clic ya tiene manejador: esperar a un boton «habilitado» no sirve,
 * porque los botones salen habilitados en el HTML del servidor y el clic caia
 * antes de hidratar —pasaba una vez de cada tres, el peor tipo de fallo—. Un
 * `useEffect` solo corre en el cliente y despues de hidratar, que es
 * exactamente la señal que hacia falta.
 *
 * No pinta nada y no cuesta nada: un atributo, una vez.
 * ============================================================================
 */
export function HydrationMark() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = '';
  }, []);
  return null;
}
