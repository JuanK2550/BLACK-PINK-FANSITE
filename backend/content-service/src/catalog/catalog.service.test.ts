// Pruebas del catálogo.

import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { CatalogService } from './catalog.service';
import type { QuizQueryDto, TimelineQueryDto, TriviaQueryDto } from './catalog.dto';

function fakePrisma(overrides: Record<string, unknown> = {}) {
  const base = {
    $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    timelineEvent: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    trivia: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    award: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
    quizQuestion: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
  };
  return { ...base, ...overrides } as unknown as PrismaService;
}

const withFilter = <T extends { includeUnverified: boolean }>(query: T): T =>
  Object.defineProperty(query, 'verifiedFilter', {
    get(this: { includeUnverified: boolean }) {
      return this.includeUnverified ? {} : { verified: true };
    },
  });

const timelineQuery = (extra: Partial<TimelineQueryDto> = {}): TimelineQueryDto =>
  withFilter({
    locale: 'es',
    page: 1,
    limit: 20,
    skip: 0,
    includeUnverified: false,
    ...extra,
  }) as TimelineQueryDto;

const triviaQuery = (extra: Partial<TriviaQueryDto> = {}): TriviaQueryDto =>
  withFilter({
    locale: 'es',
    page: 1,
    limit: 20,
    skip: 0,
    random: false,
    includeUnverified: false,
    ...extra,
  }) as TriviaQueryDto;

const quizQuery = (extra: Partial<QuizQueryDto> = {}): QuizQueryDto =>
  withFilter({
    locale: 'es',
    page: 1,
    limit: 20,
    skip: 0,
    random: false,
    includeAnswers: true,
    includeUnverified: false,
    ...extra,
  }) as QuizQueryDto;

describe('CatalogService', () => {
  describe('cronologia', () => {
    it('rechaza un rango de fechas invertido antes de tocar la base', async () => {
      const prisma = fakePrisma();
      const service = new CatalogService(prisma);

      await expect(
        service.timeline(timelineQuery({ from: '2023-01-01', to: '2020-01-01' })),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.timelineEvent.count).not.toHaveBeenCalled();
    });

    it('filtra por integrante a traves de la relacion, no por un id suelto', async () => {
      const prisma = fakePrisma();
      const service = new CatalogService(prisma);

      await service.timeline(timelineQuery({ memberSlug: 'lisa' }));

      const call = vi.mocked(prisma.timelineEvent.findMany).mock.calls[0]?.[0];
      expect(call?.where).toMatchObject({ member: { slug: 'lisa' }, verified: true });
    });

    it('por defecto excluye lo que no esta contrastado', async () => {
      const prisma = fakePrisma();
      await new CatalogService(prisma).timeline(timelineQuery());

      const call = vi.mocked(prisma.timelineEvent.findMany).mock.calls[0]?.[0];
      expect(call?.where).toMatchObject({ verified: true });
    });

    it('con includeUnverified=true deja pasar el contenido sin contrastar', async () => {
      const prisma = fakePrisma();
      await new CatalogService(prisma).timeline(timelineQuery({ includeUnverified: true }));

      const call = vi.mocked(prisma.timelineEvent.findMany).mock.calls[0]?.[0];
      expect(call?.where).not.toHaveProperty('verified');
    });

    it('usa la traduccion del idioma pedido y cae al espanol si falta', async () => {
      const prisma = fakePrisma({
        timelineEvent: {
          count: vi.fn().mockResolvedValue(1),
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'e1',
              date: new Date('2016-08-08T00:00:00.000Z'),
              datePrecision: 'day',
              title: 'Debut',
              description: 'Texto canonico',
              category: 'DEBUT',
              importance: 5,
              imageUrl: null,
              source: 'fuente',
              verified: true,
              member: null,
              translations: [{ locale: 'es', title: 'Debut', description: 'Texto canonico' }],
            },
          ]),
        },
      });

      const result = await new CatalogService(prisma).timeline(timelineQuery({ locale: 'ko' }));

      expect(result.items[0]?.title).toBe('Debut');
      expect(result.items[0]?.date).toBe('2016-08-08');
    });
  });

  describe('curiosidades', () => {
    it('con random=true no pagina: devuelve siempre la primera pagina de metadatos', async () => {
      const prisma = fakePrisma({
        trivia: {
          count: vi.fn().mockResolvedValue(50),
          findMany: vi.fn().mockResolvedValue([]),
        },
      });

      const result = await new CatalogService(prisma).trivia(
        triviaQuery({ random: true, page: 7, limit: 5 }),
      );

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(50);
    });

    it('el desplazamiento aleatorio nunca deja menos elementos que el limite', async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      const prisma = fakePrisma({
        trivia: { count: vi.fn().mockResolvedValue(10), findMany },
      });
      const service = new CatalogService(prisma);

      for (let i = 0; i < 40; i += 1) {
        await service.trivia(triviaQuery({ random: true, limit: 4 }));
      }

      for (const call of findMany.mock.calls) {
        expect(call[0].skip).toBeGreaterThanOrEqual(0);
        expect(call[0].skip).toBeLessThanOrEqual(6);
      }
    });
  });

  describe('quiz', () => {
    it('solo pregunta por datos contrastados, aunque no se pida', async () => {
      const prisma = fakePrisma();
      await new CatalogService(prisma).quiz(quizQuery());

      const call = vi.mocked(prisma.quizQuestion.findMany).mock.calls[0]?.[0];
      expect(call?.where).toMatchObject({ verified: true });
    });

    it('el conteo total tambien respeta el filtro, o la paginacion mentiria', async () => {
      const prisma = fakePrisma();
      await new CatalogService(prisma).quiz(quizQuery());

      const countCall = vi.mocked(prisma.quizQuestion.count).mock.calls[0]?.[0];
      expect(countCall?.where).toMatchObject({ verified: true });
    });

    it('oculta la respuesta correcta cuando includeAnswers es false', async () => {
      const prisma = fakePrisma({
        quizQuestion: {
          count: vi.fn().mockResolvedValue(1),
          findMany: vi.fn().mockResolvedValue([
            {
              id: 'q1',
              question: 'Ano de debut?',
              options: ['2015', '2016'],
              correctIndex: 1,
              difficulty: 'EASY',
              explanation: 'Debutaron en 2016.',
              translations: [],
            },
          ]),
        },
      });

      const service = new CatalogService(prisma);

      const withAnswers = await service.quiz(quizQuery({ includeAnswers: true }));
      expect(withAnswers.items[0]?.correctIndex).toBe(1);
      expect(withAnswers.items[0]?.explanation).toBe('Debutaron en 2016.');

      const withoutAnswers = await service.quiz(quizQuery({ includeAnswers: false }));
      expect(withoutAnswers.items[0]).not.toHaveProperty('correctIndex');
      expect(withoutAnswers.items[0]).not.toHaveProperty('explanation');
    });
  });
});
