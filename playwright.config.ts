import { defineConfig, devices } from '@playwright/test';

/**
 * ============================================================================
 * PLAYWRIGHT
 * ============================================================================
 * Los e2e recorren el sitio DE VERDAD: el navegador, el servidor de Next, el
 * gateway y los servicios. Es la única capa que puede afirmar cosas que
 * ninguna otra puede —que las respuestas del quiz no están en el HTML, que
 * cambiar de idioma conserva la página, que el reproductor no se monta hasta
 * que alguien lo pide— porque todas dependen de la integración completa.
 *
 * EL SERVIDOR SE LEVANTA SOLO, contra el BUILD y no contra `next dev`. En
 * desarrollo Next compila bajo demanda: la primera visita a cada ruta tarda
 * segundos y los tests se llenan de esperas que no prueban nada. Y sobre todo,
 * `next dev` no genera el HTML estático que estos tests inspeccionan.
 *
 * `reuseExistingServer` en local, nunca en CI: al iterar es lo que evita
 * esperar un build de dos minutos por cada pasada, y en CI sería aceptar un
 * servidor de procedencia desconocida.
 *
 * UN SOLO NAVEGADOR POR DEFECTO. Este sitio no tiene código específico de
 * motor, así que ejecutar la misma suite tres veces gasta minutos de CI para
 * repetir el mismo resultado. El proyecto móvil sí está: comprueba lo que de
 * verdad cambia, que es el ancho.
 * ============================================================================
 */

const PUERTO = Number(process.env.E2E_PORT ?? 3210);
const BASE = process.env.E2E_BASE_URL ?? `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: './e2e',
  // Un e2e que tarda más de un minuto está esperando algo que no llega.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  fullyParallel: true,
  // En CI, un `test.only` olvidado dejaría pasar el resto sin ejecutarse.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE,
    // Traza solo del reintento: guardar siempre llena el artefacto de CI con
    // trazas de tests que pasaron.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // `exec next start` y no el script `start`: ese ya lleva `--port 3000`
        // y encadenar un segundo `--port` deja el resultado a merced del parser.
        command: `pnpm --filter @blackpink/web exec next start --port ${PUERTO}`,
        url: BASE,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
