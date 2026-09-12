// Utilidades comunes de las pruebas del navegador.

import { expect, type Page } from '@playwright/test';

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

const AVISO: Record<string, RegExp> = {
  es: /no oficial/i,
  en: /unofficial/i,
  ko: /비공식/,
};

export async function expectAvisoNoOficial(page: Page, locale = 'es') {
  await expect(page.getByText(AVISO[locale]!).first()).toBeVisible();
}

export async function esperarHidratacion(page: Page, _locale = 'es') {
  await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
}
