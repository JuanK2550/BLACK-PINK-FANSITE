import { describe, expect, it, vi } from 'vitest';
import { AiError, type AiProvider } from '../provider/ai-provider';
import type { RetrievalService } from '../rag/retrieval.service';
import type { VectorStoreService } from '../rag/vector-store.service';
import { AuditService } from '../safety/audit.service';
import { SafetyService } from '../safety/safety.service';
import { ChatService, type ChatEvent } from './chat.service';

/**
 * El flujo entero se prueba SIN red y SIN clave: el proveedor es una interfaz
 * propia justamente para esto. Un test que necesita la API de Google acaba
 * desactivado el dia que se agota la cuota, y un test desactivado no protege.
 */

function providerYielding(pieces: string[], configured = true): AiProvider {
  return {
    describe: () => 'doble',
    isConfigured: () => configured,
    embed: vi.fn().mockResolvedValue([[0.1, 0.2]]),
    streamChat: async function* () {
      for (const piece of pieces) yield piece;
    },
  };
}

function retrievalWith(chunks: { sourceLabel: string; sourcePath: string; text: string }[]) {
  return {
    retrieve: vi
      .fn()
      .mockResolvedValue(chunks.map((c, i) => ({ ...c, id: String(i), score: 0.8 }))),
    format: (list: { sourceLabel: string; text: string }[]) =>
      list.map((c, i) => `[${i + 1}] (${c.sourceLabel}) ${c.text}`).join('\n\n'),
  } as unknown as RetrievalService;
}

const store = { count: vi.fn().mockResolvedValue(0) } as unknown as VectorStoreService;

/** La capa de seguridad real, no un doble: es parte del flujo que se prueba. */
const safety = new SafetyService(new AuditService());

async function collect(events: AsyncIterable<ChatEvent>): Promise<ChatEvent[]> {
  const out: ChatEvent[] = [];
  for await (const event of events) out.push(event);
  return out;
}

const CONTEXT = [
  {
    sourceLabel: 'Ficha de BORN PINK',
    sourcePath: '/discografia/born-pink',
    text: 'Salio en 2022.',
  },
];

describe('ChatService', () => {
  it('emite el texto por trozos y cierra con la accion', async () => {
    const service = new ChatService(
      providerYielding(['BORN ', 'PINK salio en 2022.']),
      retrievalWith(CONTEXT),
      store,
      safety,
    );

    const events = await collect(service.answer('cuando salio born pink', 'es', []));
    const text = events
      .filter((e): e is Extract<ChatEvent, { type: 'token' }> => e.type === 'token')
      .map((e) => e.text)
      .join('');

    expect(text).toBe('BORN PINK salio en 2022.');
    expect(events.at(-1)?.type).toBe('done');
  });

  /*
   * El marcador llega troceado por la red. Si "ACC" sale al cliente antes de
   * reconocerse, el visitante ve la respuesta terminada en basura.
   */
  it('no deja asomar el marcador aunque llegue partido en trozos', async () => {
    const service = new ChatService(
      providerYielding([
        'Mira la ficha.',
        '\nACC',
        'ION: {"action":"navi',
        'gate","path":"/discografia/born-pink"}',
      ]),
      retrievalWith(CONTEXT),
      store,
      safety,
    );

    const events = await collect(service.answer('born pink', 'es', []));
    const text = events
      .filter((e): e is Extract<ChatEvent, { type: 'token' }> => e.type === 'token')
      .map((e) => e.text)
      .join('');

    expect(text).toBe('Mira la ficha.');
    expect(text).not.toContain('ACC');

    const done = events.at(-1) as Extract<ChatEvent, { type: 'done' }>;
    expect(done.action).toEqual({
      action: 'navigate',
      path: '/es/discografia/born-pink',
      label: 'Ficha de BORN PINK',
    });
  });

  it('cita la seccion de la que sale la informacion', async () => {
    const service = new ChatService(
      providerYielding(['Segun la ficha, salio en 2022.']),
      retrievalWith(CONTEXT),
      store,
      safety,
    );

    const events = await collect(service.answer('born pink', 'es', []));
    const done = events.at(-1) as Extract<ChatEvent, { type: 'done' }>;

    expect(done.citations).toEqual([
      { label: 'Ficha de BORN PINK', path: '/es/discografia/born-pink' },
    ]);
  });

  it('sin contexto no cita nada: no hay de donde', async () => {
    const service = new ChatService(
      providerYielding(['No lo tengo en el sitio.']),
      retrievalWith([]),
      store,
      safety,
    );

    const events = await collect(service.answer('quien gano la liga', 'es', []));
    const done = events.at(-1) as Extract<ChatEvent, { type: 'done' }>;
    expect(done.citations).toEqual([]);
  });

  it('sin clave configurada lo dice y no llama a nadie', async () => {
    const provider = providerYielding([], false);
    const service = new ChatService(provider, retrievalWith(CONTEXT), store, safety);

    const events = await collect(service.answer('hola', 'es', []));

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'error', code: 'NOT_CONFIGURED' });
  });

  it('la cuota agotada se explica como algo temporal, no como un error', async () => {
    const provider = providerYielding([]);
    provider.streamChat = () => {
      throw new AiError('quota', 'agotada');
    };

    const service = new ChatService(provider, retrievalWith(CONTEXT), store, safety);
    const events = await collect(service.answer('hola', 'es', []));
    const error = events.at(-1) as Extract<ChatEvent, { type: 'error' }>;

    expect(error.code).toBe('QUOTA');
    expect(error.message).toMatch(/vuelve/i);
  });

  it('responde en el idioma pedido, tambien al fallar', async () => {
    const provider = providerYielding([], false);

    const ko = await collect(
      new ChatService(provider, retrievalWith([]), store, safety).answer('안녕', 'ko', []),
    );
    expect((ko[0] as Extract<ChatEvent, { type: 'error' }>).message).toContain('두뇌');

    const en = await collect(
      new ChatService(provider, retrievalWith([]), store, safety).answer('hi', 'en', []),
    );
    expect((en[0] as Extract<ChatEvent, { type: 'error' }>).message).toContain('brain');
  });

  it('las sugerencias vienen en los tres idiomas y no gastan cuota', () => {
    const service = new ChatService(providerYielding([]), retrievalWith([]), store, safety);

    expect(service.suggestions('es')[0]).toContain('debuto');
    expect(service.suggestions('en')[0]).toContain('debut');
    expect(service.suggestions('ko')[0]).toContain('데뷔');
  });
});
