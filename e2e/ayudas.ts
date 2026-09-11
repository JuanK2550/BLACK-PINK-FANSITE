import { expect, type Page } from '@playwright/test';

/**
 * ============================================================================
 * AYUDAS COMUNES DE LOS E2E
 * ============================================================================
 * Lo que se repite en todas las specs y NO debe variar entre ellas: el aviso de
 * sitio no oficial, la lista de secciones y la forma de esperar a que una
 * página esté de verdad lista.
 * ============================================================================
 */

/** Las secciones del menú principal. Cada una tiene que existir: no 404. */
export const SECCIONES = [
  '/grupo',
  '/integrantes',
  '/discografia',
  '/cronologia',
  '/curiosidades',
  '/playlists',
  '/premios',
  '/galeria',
  '/quiz',
] as const;

/**
 * El aviso es la regla 5 del proyecto: visible en TODAS las páginas. Se
 * comprueba por su texto y no por un selector, porque lo que importa es que
 * alguien lo pueda leer, no que exista un nodo con cierta clase.
 */
const AVISO: Record<string, RegExp> = {
  es: /no oficial/i,
  en: /unofficial/i,
  ko: /비공식/,
};

export async function expectAvisoNoOficial(page: Page, locale = 'es') {
  await expect(page.getByText(AVISO[locale]!).first()).toBeVisible();
}

/**
 * Espera a que React haya tomado la pagina.
 *
 * NI `networkidle` NI UN BOTON HABILITADO SIRVEN. La red rara vez queda quieta
 * —PINKY pide sugerencias y Next precarga rutas—, y los botones salen ya
 * habilitados en el HTML del servidor: esperar a uno dejaba hacer clic antes
 * de que tuviera manejador, y el test fallaba una vez de cada tres.
 * `HydrationMark` pone `data-hydrated` en `<html>` desde un efecto, que solo
 * corre despues de hidratar.
 */
export async function esperarHidratacion(page: Page, _locale = 'es') {
  await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
}
