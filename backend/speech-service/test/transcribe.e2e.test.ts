// Pruebas HTTP de extremo a extremo de la transcripción.

import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import type { INestApplication } from '@nestjs/common';
import { configureService } from '@blackpink/service-core';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ASR_PROVIDER, AsrError, type AsrProvider } from '../src/provider/asr-provider';
import { ProviderModule } from '../src/provider/provider.module';
import { TranscribeModule } from '../src/transcribe/transcribe.module';

const transcribeSpy = vi.fn();

const fakeProvider: AsrProvider = {
  describe: () => 'doble',
  isConfigured: () => true,
  transcribe: (...args) => transcribeSpy(...args) as ReturnType<AsrProvider['transcribe']>,
};

const webm = () => Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(64)]);
const png = () =>
  Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);

async function bootstrap(limit: number): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({})] }),
      ThrottlerModule.forRoot({
        throttlers: [{ name: 'speech', ttl: 600_000, limit }],
      }),
      ProviderModule,
      TranscribeModule,
    ],
  })
    .overrideProvider(ASR_PROVIDER)
    .useValue(fakeProvider)
    .compile();

  const app = moduleRef.createNestApplication();
  configureService(app, { service: 'speech-service', title: 't', description: 'd' });
  await app.init();
  return app;
}

describe('POST /api/v1/transcribe', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrap(100);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('devuelve texto, idioma y confianza dentro del envelope', async () => {
    transcribeSpy.mockResolvedValueOnce({
      text: '블랙핑크 언제 데뷔했어요',
      detectedLanguage: 'ko',
      confidence: 0.93,
      durationSec: 3.2,
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/transcribe')
      .attach('audio', webm(), { filename: 'grabacion.webm', contentType: 'audio/webm' })
      .expect(201);

    expect(response.body.data).toEqual({
      text: '블랙핑크 언제 데뷔했어요',
      detectedLanguage: 'ko',
      confidence: 0.93,
      durationSec: 3.2,
    });
    expect(response.body.error).toBeNull();
    expect(response.body.meta.service).toBe('speech-service');
  });

  it('reenvia el audio con la extension deducida de los bytes, no con la del cliente', async () => {
    transcribeSpy.mockResolvedValueOnce({
      text: 'hola',
      detectedLanguage: 'es',
      confidence: 0.9,
      durationSec: 1,
    });

    await request(app.getHttpServer())
      .post('/api/v1/transcribe')
      .attach('audio', webm(), { filename: '../../etc/passwd.mp3', contentType: 'audio/mpeg' })
      .expect(201);

    const [sent] = transcribeSpy.mock.calls.at(-1)!;
    expect(sent.filename).toBe('audio.webm');
    expect(sent.mimeType).toBe('audio/webm');
  });

  it('no manda pista de idioma si el cliente no la pide', async () => {
    transcribeSpy.mockResolvedValueOnce({
      text: 'hola',
      detectedLanguage: 'es',
      confidence: 0.9,
      durationSec: 1,
    });

    await request(app.getHttpServer())
      .post('/api/v1/transcribe')
      .attach('audio', webm(), { filename: 'a.webm', contentType: 'audio/webm' })
      .expect(201);

    expect(transcribeSpy.mock.calls.at(-1)![0].language).toBeUndefined();
  });

  describe('validacion', () => {
    it('rechaza un fichero que no es audio aunque se anuncie como tal', async () => {
      const before = transcribeSpy.mock.calls.length;

      const response = await request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .attach('audio', png(), { filename: 'trampa.webm', contentType: 'audio/webm' })
        .expect(400);

      expect(response.body.error.code).toBe('UNSUPPORTED_FORMAT');
      expect(transcribeSpy.mock.calls.length).toBe(before);
    });

    it('rechaza que no venga fichero', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .field('language', 'es')
        .expect(400);

      expect(response.body.error.code).toBe('EMPTY_AUDIO');
    });

    it('rechaza un fichero vacio', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .attach('audio', Buffer.alloc(0), { filename: 'a.webm', contentType: 'audio/webm' })
        .expect(400);

      expect(response.body.error.code).toBe('EMPTY_AUDIO');
    });

    it('rechaza un idioma que no es de los tres del sitio', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .attach('audio', webm(), { filename: 'a.webm', contentType: 'audio/webm' })
        .field('language', 'fr')
        .expect(400);
    });

    it('rechaza un audio mas largo que el maximo, descartando el texto', async () => {
      transcribeSpy.mockResolvedValueOnce({
        text: 'una parrafada de dos minutos',
        detectedLanguage: 'es',
        confidence: 0.9,
        durationSec: 125,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .attach('audio', webm(), { filename: 'largo.webm', contentType: 'audio/webm' })
        .expect(400);

      expect(response.body.error.code).toBe('AUDIO_TOO_LONG');
      expect(JSON.stringify(response.body)).not.toContain('parrafada');
    });
  });

  describe('errores del proveedor, cada uno con su codigo', () => {
    it('cuota agotada -> 429 ASR_QUOTA', async () => {
      transcribeSpy.mockRejectedValueOnce(new AsrError('quota', 'agotada', 30));

      const response = await request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .attach('audio', webm(), { filename: 'a.webm', contentType: 'audio/webm' })
        .expect(429);

      expect(response.body.error.code).toBe('ASR_QUOTA');
    });

    it('sin clave -> 503, y sin decir que falta una clave', async () => {
      transcribeSpy.mockRejectedValueOnce(new AsrError('not_configured', 'sin clave'));

      const response = await request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .attach('audio', webm(), { filename: 'a.webm', contentType: 'audio/webm' })
        .expect(503);

      expect(response.body.error.code).toBe('ASR_NOT_CONFIGURED');
      expect(response.body.error.message).not.toMatch(/clave|key/i);
    });

    it('audio sin voz -> 400 EMPTY_AUDIO', async () => {
      transcribeSpy.mockRejectedValueOnce(new AsrError('empty_audio', 'silencio'));

      const response = await request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .attach('audio', webm(), { filename: 'a.webm', contentType: 'audio/webm' })
        .expect(400);

      expect(response.body.error.code).toBe('EMPTY_AUDIO');
    });

    it('un fallo inesperado no filtra el mensaje interno', async () => {
      transcribeSpy.mockRejectedValueOnce(new Error('ECONNREFUSED 10.0.0.5:443'));

      const response = await request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .attach('audio', webm(), { filename: 'a.webm', contentType: 'audio/webm' })
        .expect(503);

      expect(response.body.error.code).toBe('ASR_UNAVAILABLE');
      expect(JSON.stringify(response.body)).not.toContain('10.0.0.5');
    });
  });
});

describe('limite de transcripciones por IP', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrap(2);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('corta al superarlo, con un codigo distinto del de la cuota del proveedor', async () => {
    transcribeSpy.mockResolvedValue({
      text: 'hola',
      detectedLanguage: 'es',
      confidence: 0.9,
      durationSec: 1,
    });

    const send = () =>
      request(app.getHttpServer())
        .post('/api/v1/transcribe')
        .attach('audio', webm(), { filename: 'a.webm', contentType: 'audio/webm' });

    await send().expect(201);
    await send().expect(201);

    const blocked = await send().expect(429);
    expect(blocked.body.error.code).toBe('SPEECH_RATE_LIMIT');
  });
});
