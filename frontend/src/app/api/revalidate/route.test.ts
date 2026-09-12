// Pruebas del endpoint de revalidación.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();

vi.mock('next/cache', () => ({ revalidateTag, revalidatePath }));

const SECRETO = 'secreto-de-revalidacion-largo-0123456789';

async function llamar(authorization?: string) {
  const { POST } = await import('./route');
  return POST(
    new Request('http://localhost/api/revalidate', {
      method: 'POST',
      headers: authorization ? { authorization } : {},
    }),
  );
}

beforeEach(() => {
  revalidateTag.mockReset();
  revalidatePath.mockReset();
  vi.stubEnv('REVALIDATE_SECRET', SECRETO);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/revalidate', () => {
  it('sin cabecera responde 404 y no toca la caché', async () => {
    const res = await llamar();
    expect(res.status).toBe(404);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('con un secreto equivocado, 404', async () => {
    const res = await llamar('Bearer otro-secreto-igual-de-largo-pero-malo');
    expect(res.status).toBe(404);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('con el marcador de .env.example sin cambiar, la ruta sigue cerrada', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'cambia-esto-tambien');
    const res = await llamar('Bearer cambia-esto-tambien');
    expect(res.status).toBe(404);
  });

  it('con el secreto bueno tira las etiquetas Y el layout', async () => {
    const res = await llamar(`Bearer ${SECRETO}`);
    expect(res.status).toBe(200);

    expect(revalidateTag).toHaveBeenCalledWith('members');
    expect(revalidateTag).toHaveBeenCalledWith('quiz');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});
