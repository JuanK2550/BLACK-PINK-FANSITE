// Pruebas de accesibilidad con axe.

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGINAS = [
  '/es',
  '/es/grupo',
  '/es/integrantes',
  '/es/integrantes/jisoo',
  '/es/integrantes/comparar',
  '/es/discografia',
  '/es/discografia/born-pink',
  '/es/cronologia',
  '/es/galeria',
  '/es/quiz',
  '/es/creditos',
  '/ko',
  '/ko/integrantes/comparar',
  '/ko/galeria',
];

const ETIQUETAS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function graves(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => {
      const nodo = v.nodes[0];
      return (
        `${v.id} (${v.impact}): ${v.nodes.length} nodos — ${v.help}` +
        ` | en ${nodo?.target.join(' ')} | ${nodo?.html.slice(0, 160)}`
      );
    });
}

async function analizar(page: Page, info: import('@playwright/test').TestInfo, dentro?: string) {
  let builder = new AxeBuilder({ page }).withTags(ETIQUETAS_WCAG).exclude('iframe');
  if (dentro) builder = builder.include(dentro);
  const resultado = await builder.analyze();

  await info.attach('axe.json', {
    body: JSON.stringify(resultado.violations, null, 2),
    contentType: 'application/json',
  });

  return resultado;
}

for (const ruta of PAGINAS) {
  test(`axe: ${ruta} sin fallos graves`, async ({ page }, info) => {
    await page.goto(ruta);
    await page.getByRole('heading', { level: 1 }).first().waitFor();

    const resultado = await analizar(page, info);
    expect(graves(resultado.violations), `axe encontro fallos graves en ${ruta}`).toEqual([]);
  });
}

test('axe: el lightbox de la galeria abierto', async ({ page }, info) => {
  await page.goto('/es/galeria');
  await page
    .getByRole('button', { name: /^Abrir / })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const resultado = await analizar(page, info, '[role="dialog"]');
  expect(graves(resultado.violations)).toEqual([]);
});

test('axe: el panel de PINKY abierto', async ({ page }, info) => {
  await page.goto('/es');
  await page.getByRole('button', { name: 'Abrir el chat con PINKY' }).click();
  await expect(page.getByRole('dialog', { name: /Chat con PINKY/ })).toBeVisible();

  const resultado = await analizar(page, info, '[role="dialog"]');
  expect(graves(resultado.violations)).toEqual([]);
});
