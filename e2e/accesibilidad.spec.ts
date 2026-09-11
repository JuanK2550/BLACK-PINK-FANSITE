import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * ============================================================================
 * ACCESIBILIDAD AUTOMATIZADA (axe-core)
 * ============================================================================
 * Se pasa axe por las paginas con mas estructura propia —rejillas, filtros,
 * tablas de comparacion, lightbox— en español y en coreano. El coreano no es
 * relleno: es donde se rompen cosas que en español no se ven (el `lang`, las
 * etiquetas que no se tradujeron).
 *
 * FALLA CON `serious` Y `critical`. Las `minor` y `moderate` quedan en el
 * informe adjunto pero no tumban el pull request: un umbral que no deja pasar
 * nada acaba desactivado la primera semana, y uno que deja pasar lo grave no
 * sirve de nada.
 *
 * LO QUE AXE NO VE, Y NO SE LE PIDE: el contraste del COLOR PROPIO de cada
 * integrante (es un dato de la base, no un token) lo cubre `.bp-member-ink` y
 * se midio en los tres temas; el contraste de los tokens lo cubre
 * `pnpm check:contrast`. axe es una red, no una auditoria completa.
 *
 * Los iframes de Spotify se EXCLUYEN: son de otro dominio y lo que haya dentro
 * no lo podemos arreglar.
 * ============================================================================
 */

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
  return (
    violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      // El PRIMER nodo va en el mensaje: un «1 nodo falla» sin decir cual
      // obliga a volver a ejecutar la suite en local para encontrarlo.
      .map((v) => {
        const nodo = v.nodes[0];
        return (
          `${v.id} (${v.impact}): ${v.nodes.length} nodos — ${v.help}` +
          ` | en ${nodo?.target.join(' ')} | ${nodo?.html.slice(0, 160)}`
        );
      })
  );
}

async function analizar(page: Page, info: import('@playwright/test').TestInfo, dentro?: string) {
  let builder = new AxeBuilder({ page }).withTags(ETIQUETAS_WCAG).exclude('iframe');
  if (dentro) builder = builder.include(dentro);
  const resultado = await builder.analyze();

  // Todo al informe, para leerlo sin volver a ejecutar la suite.
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
