// Pruebas del indexador.

import { describe, expect, it, vi } from 'vitest';
import type { AiProvider } from '../provider/ai-provider';
import type { ContentSourceService, SourceItem } from './content-source.service';
import { IndexerService } from './indexer.service';
import type { VectorStoreService } from './vector-store.service';

const item: SourceItem = {
  key: 'member:jisoo',
  sourceLabel: 'Ficha de JISOO',
  sourcePath: '/integrantes/jisoo',
  text: 'JISOO es vocalista de BLACKPINK.',
};

function indexer(report: { items: SourceItem[]; failed: string[] }, existing: number) {
  const source = { collectWithReport: vi.fn().mockResolvedValue(report) };
  const store = {
    count: vi.fn().mockResolvedValue(existing),
    replaceLocale: vi.fn().mockResolvedValue(undefined),
  };
  const ai = {
    embed: vi.fn(({ texts }: { texts: string[] }) => Promise.resolve(texts.map(() => [0.1, 0.2]))),
  };
  const service = new IndexerService(
    ai as unknown as AiProvider,
    source as unknown as ContentSourceService,
    store as unknown as VectorStoreService,
  );
  return { service, store };
}

describe('IndexerService', () => {
  it('con una seccion caida y un indice anterior, conserva el anterior', async () => {
    const { service, store } = indexer({ items: [item], failed: ['/api/v1/albums'] }, 186);

    await expect(service.reindexLocale('ko')).resolves.toBe(0);
    expect(store.replaceLocale).not.toHaveBeenCalled();
  });

  it('sin indice anterior, el parcial entra: mejor eso que un chat mudo', async () => {
    const { service, store } = indexer({ items: [item], failed: ['/api/v1/albums'] }, 0);

    await expect(service.reindexLocale('ko')).resolves.toBe(1);
    expect(store.replaceLocale).toHaveBeenCalledOnce();
  });

  it('con todo recibido, sustituye el indice aunque ya hubiera uno', async () => {
    const { service, store } = indexer({ items: [item], failed: [] }, 186);

    await expect(service.reindexLocale('es')).resolves.toBe(1);
    expect(store.replaceLocale).toHaveBeenCalledWith('es', [
      expect.objectContaining({ id: 'es:member:jisoo', locale: 'es' }),
    ]);
  });
});
