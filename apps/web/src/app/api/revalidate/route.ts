import { timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * ============================================================================
 * REVALIDACIÓN ISR BAJO DEMANDA
 * ============================================================================
 * `POST /api/revalidate` con `Authorization: Bearer <REVALIDATE_SECRET>` tira la
 * caché de datos y de páginas y hace que la siguiente visita las regenere.
 *
 * EXISTE PORQUE `REVALIDATE_SECRET` LLEVABA EN `.env.example` DESDE LA FASE 5 Y
 * NINGUNA RUTA LO USABA: una variable que se documenta y no se lee es una
 * promesa que nadie cumple. Lo llama el cron semanal `content-refresh.yml`, y
 * sirve igual a mano después de sembrar contenido nuevo.
 *
 * SE REVALIDAN LAS ETIQUETAS Y EL LAYOUT ENTERO. Las etiquetas son las que
 * `lib/api.ts` pone a cada petición; el layout de `/` cubre las páginas que no
 * piden nada con etiqueta. Hacer solo lo segundo dejaría viva la caché de
 * `fetch`, y la página se regeneraría con los datos viejos.
 *
 * EL SECRETO SE COMPARA EN TIEMPO CONSTANTE y se exige de al menos 24
 * caracteres: `.env.example` trae «cambia-esto-tambien» como marcador, y un
 * despliegue que lo dejó tal cual no debe tener la ruta abierta con una clave
 * que está publicada en el repositorio. Sin secreto válido responde 404, no
 * 401, por la misma razón que el resto del proyecto: un 401 confirma que la
 * ruta existe.
 * ============================================================================
 */

export const runtime = 'nodejs';

/** Las etiquetas que usa `lib/api.ts`. Las de detalle cuelgan de estas. */
const ETIQUETAS = [
  'members',
  'albums',
  'timeline',
  'trivia',
  'awards',
  'quiz',
  'playlists',
] as const;

const LONGITUD_MINIMA = 24;

function autorizado(cabecera: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET ?? '';
  if (esperado.length < LONGITUD_MINIMA || !cabecera?.startsWith('Bearer ')) return false;

  const recibido = Buffer.from(cabecera.slice('Bearer '.length), 'utf8');
  const secreto = Buffer.from(esperado, 'utf8');
  return recibido.length === secreto.length && timingSafeEqual(recibido, secreto);
}

export async function POST(request: Request) {
  if (!autorizado(request.headers.get('authorization'))) {
    return new Response(null, { status: 404 });
  }

  for (const etiqueta of ETIQUETAS) revalidateTag(etiqueta);
  revalidatePath('/', 'layout');

  return Response.json({
    revalidated: true,
    tags: ETIQUETAS,
    at: new Date().toISOString(),
  });
}
