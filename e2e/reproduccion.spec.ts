// Pruebas del reproductor de Spotify.

import { expect, test } from '@playwright/test';
import { esperarHidratacion } from './ayudas';

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
    await page.goto('/es/integrantes/jennie');
    await esperarHidratacion(page);
    await expect(page.locator('iframe[src*="spotify"]')).toHaveCount(0);

    const pistas = page.getByRole('button', { name: /^Escuchar / });
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
    await expect(page.locator('iframe[src*="spotify"]')).toHaveCount(0);
  });

  test('ningun elemento <audio> ni <video> en el sitio', async ({ page }) => {
    for (const ruta of ['/es', '/es/discografia/born-pink', '/es/playlists']) {
      await page.goto(ruta);
      await expect(page.locator('audio, video')).toHaveCount(0);
    }
  });
});
