import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController (chatbot-service)', () => {
  it('devuelve el estado del servicio', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok', service: 'chatbot-service' });
  });
});
