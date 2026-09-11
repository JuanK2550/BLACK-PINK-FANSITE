import { expect, test, type Page } from '@playwright/test';
import { esperarHidratacion, expectAvisoNoOficial } from './ayudas';

/**
 * ============================================================================
 * CAMBIO DE IDIOMA
 * ============================================================================
 * Tres promesas del sitio que solo se ven de extremo a extremo:
 *
 *   1. Cambiar de idioma CONSERVA LA PAGINA: desde la ficha de BORN PINK en
 *      español se llega a la ficha de BORN PINK en inglés, no a la portada.
 *   2. `<html lang>` cambia con el idioma. Es lo que decide la voz del lector
 *      de pantalla y la fuente del hangul (`:lang(ko)`).
 *   3. La eleccion se RECUERDA en la cookie `NEXT_LOCALE`, pero una URL con
 *      idioma manda sobre ella: un enlace compartido no se traduce solo.
 * ============================================================================
 */

/**
 * Abre el selector de idioma donde este. En escritorio va en la cabecera; en
 * movil vive DENTRO del menu hamburguesa, y buscarlo en la cabecera esperaba
 * un minuto a un boton que a ese ancho no existe.
 */
async function abrirSelector(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: 'Abrir el menú' }).click();
  await page
    .getByRole('button', { name: 'Cambiar de idioma' })
    .filter({ visible: true })
    .first()
    .click();
}

test.describe('idioma', () => {
  test('cambiar de idioma conserva la pagina y cambia <html lang>', async ({ page, isMobile }) => {
    await page.goto('/es/discografia/born-pink');
    await esperarHidratacion(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await abrirSelector(page, isMobile);
    await page.getByRole('menuitemradio', { name: /English/i }).click();

    await expect(page).toHaveURL(/\/en\/discografia\/born-pink$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expectAvisoNoOficial(page, 'en');
  });

  test('en coreano el aviso tambien se lee, y en hangul', async ({ page }) => {
    await page.goto('/ko/grupo');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    await expectAvisoNoOficial(page, 'ko');
  });

  test('la eleccion queda en la cookie NEXT_LOCALE', async ({ page, context, isMobile }) => {
    await page.goto('/es');
    await esperarHidratacion(page);
    await abrirSelector(page, isMobile);
    await page.getByRole('menuitemradio', { name: /한국어/ }).click();
    await expect(page).toHaveURL(/\/ko/);

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'NEXT_LOCALE')?.value).toBe('ko');
  });

  test('una URL con idioma manda sobre la cookie', async ({ page, context, baseURL }) => {
    // Quien comparte /en/quiz espera que se abra en ingles, aunque quien lo
    // recibe tenga guardado el coreano.
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'ko', url: baseURL! }]);
    await page.goto('/en/quiz');
    await expect(page).toHaveURL(/\/en\/quiz$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('la raiz redirige a un idioma con prefijo', async ({ page }) => {
    // `localePrefix: 'always'`: tambien el español lleva prefijo.
    await page.goto('/');
    await expect(page).toHaveURL(/\/(es|en|ko)$/);
  });
});
