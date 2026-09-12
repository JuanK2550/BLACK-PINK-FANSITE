// Pruebas del endpoint de salud.

import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController (speech-service)', () => {
  it('devuelve el estado del servicio', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok', service: 'speech-service' });
  });
});
