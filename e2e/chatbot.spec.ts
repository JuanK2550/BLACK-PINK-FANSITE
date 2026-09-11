import { expect, test, type Page, type Route } from '@playwright/test';
import { esperarHidratacion } from './ayudas';

/**
 * ============================================================================
 * CONVERSACION CON EL CHATBOT
 * ============================================================================
 * DOS MODOS, y la distincion es deliberada.
 *
 * POR DEFECTO, EL STREAM SE SIMULA en la red: `page.route` responde a
 * `POST /api/v1/chat` con eventos SSE escritos aqui. Es la misma regla que
 * sostiene los tests de chatbot-service —un test que necesita una API externa
 * acaba desactivado— y aqui tiene ademas una razon de dinero: Gemini en plan
 * gratuito tiene cuota por clave, y una suite que la gasta en cada pull
 * request la agota para los visitantes.
 *
 * Lo que se prueba asi es TODO lo del lado del sitio: abrir el panel, escribir,
 * enviar con Enter, que la respuesta aparezca, que el markdown se pinte, que
 * una accion `navigate` se convierta en enlace, y que el evento `blocked`
 * REEMPLACE lo pintado en vez de continuarlo (contrato de la Fase 9).
 *
 * CON `E2E_CHAT_REAL=1` se habla con el servicio de verdad. Solo afirma que
 * llega una respuesta: lo que dice el modelo no es determinista, y un test que
 * compara su texto es un test que falla los martes.
 * ============================================================================
 */

const REAL = process.env.E2E_CHAT_REAL === '1';

/** Cuerpo SSE con los eventos dados, en el formato que emite el servicio. */
function sse(eventos: unknown[]): string {
  return eventos.map((evento) => `data: ${JSON.stringify(evento)}\n\n`).join('');
}

async function responderCon(route: Route, eventos: unknown[]) {
  await route.fulfill({
    status: 200,
    headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
    body: sse(eventos),
  });
}

const PANEL = { name: /Chat con PINKY/ };

async function abrirChat(page: Page) {
  await page.goto('/es');
  await esperarHidratacion(page);
  await page.getByRole('button', { name: 'Abrir el chat con PINKY' }).click();
  await expect(page.getByRole('dialog', PANEL)).toBeVisible();
}

async function preguntar(page: Page, texto: string) {
  const campo = page.getByPlaceholder(/Preguntame sobre BLACKPINK/);
  await campo.fill(texto);
  await campo.press('Enter');
  return campo;
}

test.describe('chatbot (stream simulado)', () => {
  test.skip(REAL, 'con E2E_CHAT_REAL=1 corre la otra suite');

  test('conversacion completa: pregunta, respuesta, markdown y enlace', async ({ page }) => {
    await page.route('**/api/v1/chat', (route) =>
      responderCon(route, [
        { type: 'token', text: 'BLACKPINK debutó en ' },
        { type: 'token', text: '**2016** con *SQUARE ONE*.' },
        {
          type: 'done',
          action: { action: 'navigate', path: '/cronologia', label: 'Ver la cronología' },
          citations: [{ label: 'Cronología', path: '/cronologia' }],
        },
      ]),
    );

    await abrirChat(page);
    await preguntar(page, '¿Cuándo debutó el grupo?');

    const panel = page.getByRole('dialog', PANEL);

    // Lo tecleado se pinta TAL CUAL.
    await expect(panel.getByText('¿Cuándo debutó el grupo?')).toBeVisible();

    // El markdown del modelo se pinta; los asteriscos no se enseñan.
    await expect(panel.locator('strong', { hasText: '2016' })).toBeVisible();
    await expect(panel.locator('em', { hasText: 'SQUARE ONE' })).toBeVisible();
    await expect(panel).not.toContainText('**2016**');

    // La accion `navigate` se convierte en un enlace dentro del sitio.
    await expect(panel.getByRole('link', { name: /Ver la cronología/ })).toHaveAttribute(
      'href',
      /\/es\/cronologia$/,
    );
  });

  test('el evento blocked REEMPLAZA lo pintado, no lo continua', async ({ page }) => {
    // Si el filtro de salida corta a mitad, lo ya enviado se retira.
    // Concatenar dejaria en pantalla justo el fragmento prohibido.
    await page.route('**/api/v1/chat', (route) =>
      responderCon(route, [
        { type: 'token', text: 'FRAGMENTO QUE NO DEBE QUEDAR' },
        { type: 'blocked', text: 'Solo puedo hablar del contenido del sitio.' },
      ]),
    );

    await abrirChat(page);
    await preguntar(page, 'dime algo privado');

    const panel = page.getByRole('dialog', PANEL);
    await expect(panel.getByText('Solo puedo hablar del contenido del sitio.')).toBeVisible();
    await expect(panel).not.toContainText('FRAGMENTO QUE NO DEBE QUEDAR');
  });

  test('un error del servicio no deja el panel colgado', async ({ page }) => {
    await page.route('**/api/v1/chat', (route) =>
      route.fulfill({ status: 503, body: '{"error":{"code":"UNAVAILABLE"}}' }),
    );

    await abrirChat(page);
    const campo = await preguntar(page, 'hola');

    // El campo vuelve a estar disponible: se puede intentar otra vez.
    await expect(campo).toBeEnabled();
    await expect(page.getByRole('dialog', PANEL)).toBeVisible();
  });

  test('Esc cierra el panel y devuelve el foco a PINKY', async ({ page }) => {
    await abrirChat(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', PANEL)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Abrir el chat con PINKY' })).toBeFocused();
  });
});

test.describe('chatbot (servicio real)', () => {
  test.skip(!REAL, 'se activa con E2E_CHAT_REAL=1 y una clave de Gemini en el servicio');

  test('una pregunta recibe una respuesta', async ({ page }) => {
    await abrirChat(page);
    await preguntar(page, '¿Cuántas integrantes tiene BLACKPINK?');

    // Solo que llega texto de PINKY. Su contenido no es determinista.
    const panel = page.getByRole('dialog', PANEL);
    await expect(panel.locator('[data-role="model"]').last()).not.toBeEmpty({
      timeout: 45_000,
    });
  });
});
