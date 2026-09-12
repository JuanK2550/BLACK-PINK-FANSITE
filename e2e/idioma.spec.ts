// Pruebas del cambio de idioma.

import { expect, test, type Page } from '@playwright/test';
import { esperarHidratacion, expectAvisoNoOficial } from './ayudas';

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
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'ko', url: baseURL! }]);
    await page.goto('/en/quiz');
    await expect(page).toHaveURL(/\/en\/quiz$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('la raiz redirige a un idioma con prefijo', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/(es|en|ko)$/);
  });
});
