// Endpoint interno que refresca la caché de las páginas.

import { timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';

export const runtime = 'nodejs';

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
