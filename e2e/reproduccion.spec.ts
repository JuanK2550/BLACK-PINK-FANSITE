import { expect, test } from '@playwright/test';
import { esperarHidratacion } from './ayudas';

/**
 * ============================================================================
 * REPRODUCCION
 * ============================================================================
 * El sitio NO reproduce audio: lo unico que suena es el iframe oficial de
 * Spotify. Lo que se prueba aqui son las reglas de como aparece ese iframe:
 *
 *   - NO existe hasta que alguien lo pide. La razon es de privacidad: un iframe
 *     de Spotify ejecuta su JavaScript y escribe sus cookies, y con ocho en la
 *     ficha se los llevaba cualquiera que solo viniera a mirar el tracklist.
 *   - Es montaje condicional, no `hidden`: con `hidden` el rastro es el mismo.
 *   - Uno cada vez.
 *   - Tema oscuro (`theme=0`), `sandbox` sin `allow-top-navigation`, y
 *     `scrolling="no"`.
 *
 * NO se comprueba que suene. El contenido del iframe es de otro dominio y no
 * expone su estado; afirmar «esta sonando» seria mentir desde un test, que es
 * justo lo que el proyecto se niega a hacer desde la interfaz.
 *
 * Las peticiones a Spotify se BLOQUEAN: no hace falta su servidor para probar
 * que nuestro iframe se monta con la URL correcta, y asi el test no depende de
 * la red de un tercero ni le deja cookies a nadie.
 * ============================================================================
 */

test.beforeEach(async ({ page }) => {
  await page.route(/open\.spotify\.com|scdn\.co/, (ruta) => ruta.abort());
});

test.describe('reproduccion', () => {
  test('no hay ningun iframe de Spotify hasta que se pide', async ({ page }) => {
    await page.goto('/es/discografia/born-pink');
    await esperarHidratacion(page);
    await expect(page.locator('iframe[src*="spotify"]')).toHaveCount(0);
  });

  test('pulsar una pista monta UN reproductor con las garantias del proyecto', async ({ page }) => {
    await page.goto('/es/discografia/born-pink');
    await esperarHidratacion(page);

    /*
     * EL LOCALIZADOR SE FIJA POR `aria-controls`, NO POR SU NOMBRE. Al abrirse,
     * la fila cambia de «Escuchar X» a «Cerrar el reproductor de X» —que es lo
     * correcto: el nombre dice lo que hara la siguiente pulsacion—, y un
     * localizador por nombre pasaba a apuntar a la SIGUIENTE pista, que seguia
     * cerrada. El sitio acertaba; el test se movia.
     */
    const panel = await page
      .getByRole('button', { name: /^Escuchar / })
      .first()
      .getAttribute('aria-controls');
    const pista = page.locator(`button[aria-controls="${panel}"]`);

    await expect(pista).toHaveAttribute('aria-expanded', 'false');
    await pista.click();
    await expect(pista).toHaveAttribute('aria-expanded', 'true');
    await expect(pista).toHaveAccessibleName(/^Cerrar el reproductor de /);

    const iframe = page.locator('iframe[src*="open.spotify.com/embed"]');
    await expect(iframe).toHaveCount(1);
    await expect(iframe).toHaveAttribute('src', /theme=0/);
    await expect(iframe).toHaveAttribute('scrolling', 'no');

    const sandbox = (await iframe.getAttribute('sandbox')) ?? '';
    expect(sandbox).toContain('allow-scripts');
    // Un reproductor comprometido no puede sacar al visitante del sitio.
    expect(sandbox).not.toContain('allow-top-navigation');
  });

  test('abrir otra pista cierra la anterior: uno cada vez', async ({ page }) => {
    await page.goto('/es/discografia/born-pink');
    await esperarHidratacion(page);

    const pistas = page.getByRole('button', { name: /^Escuchar / });
    await pistas.nth(0).click();
    await pistas.nth(1).click();

    await expect(page.locator('iframe[src*="open.spotify.com/embed"]')).toHaveCount(1);
  });

  test('en la ficha de una integrante hay UN reproductor para todos sus discos', async ({
    page,
  }) => {
    /*
     * Desde la Fase 14 la ficha pinta una lista por obra. Si cada lista guardara
     * su propia pista abierta, una cancion de «Fallen Angel» y otra de «SOLO»
     * dejarian dos iframes vivos a la vez. El estado vive en la ficha entera.
     */
    await page.goto('/es/integrantes/jennie');
    await esperarHidratacion(page);
    await expect(page.locator('iframe[src*="spotify"]')).toHaveCount(0);

    const pistas = page.getByRole('button', { name: /^Escuchar / });
    // La primera es de la obra mas reciente y la ultima de la mas antigua.
    await pistas.first().click();
    await pistas.last().click();

    await expect(page.locator('iframe[src*="open.spotify.com/embed"]')).toHaveCount(1);
  });

  test('la segunda pulsacion cierra y el iframe desaparece del DOM', async ({ page }) => {
    await page.goto('/es/discografia/born-pink');
    await esperarHidratacion(page);

    await page
      .getByRole('button', { name: /^Escuchar / })
      .first()
      .click();
    await expect(page.locator('iframe[src*="spotify"]')).toHaveCount(1);

    await page
      .getByRole('button', { name: /^Cerrar el reproductor de / })
      .first()
      .click();
    // Desmontado, no oculto: con `hidden` el iframe seguiria ejecutandose.
    await expect(page.locator('iframe[src*="spotify"]')).toHaveCount(0);
  });

  test('ningun elemento <audio> ni <video> en el sitio', async ({ page }) => {
    // Regla 1 del proyecto: nunca alojar ni servir audio o video.
    for (const ruta of ['/es', '/es/discografia/born-pink', '/es/playlists']) {
      await page.goto(ruta);
      await expect(page.locator('audio, video')).toHaveCount(0);
    }
  });
});
