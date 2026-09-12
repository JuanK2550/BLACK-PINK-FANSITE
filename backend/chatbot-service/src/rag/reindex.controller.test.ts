// Pruebas del endpoint de reindexado.

import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';
import type { IndexerService } from './indexer.service';
import { ReindexController } from './reindex.controller';

const SECRETO = 'un-secreto-de-verdad-largo-y-aleatorio-123';

function montar(secreto: string | undefined, enMarcha = false) {
  const indexer = {
    isRunning: enMarcha,
    reindexAll: vi.fn().mockResolvedValue(undefined),
  } as unknown as IndexerService;
  const config = { get: vi.fn().mockReturnValue(secreto) } as unknown as ConfigService;
  return { controller: new ReindexController(indexer, config), indexer };
}

describe('ReindexController', () => {
  it('sin secreto configurado responde 404: no se confirma que exista', () => {
    const { controller, indexer } = montar(undefined);
    expect(() => controller.reindex('lo-que-sea')).toThrow(NotFoundException);
    expect(indexer.reindexAll).not.toHaveBeenCalled();
  });

  it('con el marcador de .env.example sin cambiar, tambien 404', () => {
    const { controller } = montar('cambia-esto');
    expect(() => controller.reindex('cambia-esto')).toThrow(NotFoundException);
  });

  it('con un secreto equivocado, 404 y no 401', () => {
    const { controller, indexer } = montar(SECRETO);
    expect(() => controller.reindex('otro-secreto-igual-de-largo-pero-falso-00')).toThrow(
      NotFoundException,
    );
    expect(() => controller.reindex(undefined)).toThrow(NotFoundException);
    expect(indexer.reindexAll).not.toHaveBeenCalled();
  });

  it('con el secreto bueno acepta y lanza el indexado sin esperarlo', () => {
    const { controller, indexer } = montar(SECRETO);
    expect(controller.reindex(SECRETO)).toEqual({ status: 'accepted' });
    expect(indexer.reindexAll).toHaveBeenCalledTimes(1);
  });

  it('si ya hay uno en marcha, 409: dos a la vez gastan el doble de cuota', () => {
    const { controller, indexer } = montar(SECRETO, true);
    expect(() => controller.reindex(SECRETO)).toThrow(ConflictException);
    expect(indexer.reindexAll).not.toHaveBeenCalled();
  });
});
