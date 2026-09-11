import { expect, test } from '@playwright/test';
import { SECCIONES, esperarHidratacion, expectAvisoNoOficial } from './ayudas';

/**
 * ============================================================================
 * RECORRIDO COMPLETO DE NAVEGACION
 * ============================================================================
 * Recorre cada seccion del menu y exige tres cosas en todas: que responda (no
 * 404, no 500), que tenga su titular y que el aviso de sitio no oficial este a
 * la vista.
 *
 * ESTE TEST EXISTE POR UN FALLO REAL: el menu enlazo a `/galeria` durante
 * semanas sin que la pagina existiera, y quien lo vio fue una persona, no un
 * test. Un enlace del menu a un 404 es exactamente lo que esta spec atrapa.
 * ============================================================================
 */

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
    // En movil el menu es un cajon: se recorre igual, abriendolo cada vez.
    test.skip(isMobile, 'el recorrido por menu de escritorio se prueba en escritorio');

    await page.goto('/es');
    await esperarHidratacion(page);

    // Solo las entradas que son ENLACES. «Integrantes» y «Discografía» son
    // botones que abren su mega-menú, y hacer clic en ellas no navega: esa es
    // su semántica, no un fallo.
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
    // La regla del quiz, comprobada donde de verdad se incumpliria: en lo que
    // el servidor manda. El test de componente no puede ver esto.
    const html = await (await request.get('/es/quiz')).text();
    expect(html).not.toContain('correctIndex');
    expect(html).not.toMatch(/"explanation"/);
  });
});
