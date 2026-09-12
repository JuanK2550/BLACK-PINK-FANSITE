// Pruebas de navegación por el sitio.

import { expect, test } from '@playwright/test';
import { SECCIONES, esperarHidratacion, expectAvisoNoOficial } from './ayudas';

test.describe('navegacion', () => {
  test('la portada carga con el aviso y el wordmark', async ({ page }) => {
    const respuesta = await page.goto('/es');
    expect(respuesta?.status()).toBe(200);
    await expectAvisoNoOficial(page);
    await expect(page.getByRole('link', { name: /ir al inicio/i })).toBeVisible();
  });

  for (const ruta of SECCIONES) {
    test(`${ruta} responde, tiene titular y lleva el aviso`, async ({ page }) => {
      const respuesta = await page.goto(`/es${ruta}`);
      expect(respuesta?.status(), `${ruta} no deberia dar ${respuesta?.status()}`).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectAvisoNoOficial(page);
    });
  }

  test('una ruta inexistente da 404 y sigue llevando el aviso', async ({ page }) => {
    const respuesta = await page.goto('/es/esto-no-existe');
    expect(respuesta?.status()).toBe(404);
    await expectAvisoNoOficial(page);
  });

  test('recorrido encadenado por el menu, sin teclear URLs', async ({ page, isMobile }) => {
    test.skip(isMobile, 'el recorrido por menu de escritorio se prueba en escritorio');

    await page.goto('/es');
    await esperarHidratacion(page);

    const nav = page.getByRole('navigation', { name: /Navegación principal/ });
    for (const nombre of ['Cronología', 'Curiosidades', 'Premios', 'Galería', 'Quiz']) {
      await nav.getByRole('link', { name: nombre, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectAvisoNoOficial(page);
    }
  });

  test('de integrantes a una ficha y de ahi al comparador', async ({ page }) => {
    await page.goto('/es/integrantes');
    await page.getByRole('link', { name: /JISOO/ }).first().click();
    await expect(page).toHaveURL(/\/es\/integrantes\/jisoo$/);
    await expect(page.getByRole('heading', { level: 1, name: 'JISOO' })).toBeVisible();

    await page.goto('/es/integrantes/comparar?a=jisoo&b=rose');
    await expect(page.getByText('Kim Ji-soo')).toBeVisible();
    await expect(page.getByText('Roseanne Park')).toBeVisible();
  });
});

test.describe('quiz', () => {
  test('las respuestas correctas NO viajan en el HTML', async ({ request }) => {
    const html = await (await request.get('/es/quiz')).text();
    expect(html).not.toContain('correctIndex');
    expect(html).not.toMatch(/"explanation"/);
  });
});
