import { BadRequestException, Injectable } from '@nestjs/common';
import type { PageMeta } from '@blackpink/types';
import { buildPageMeta } from '@blackpink/service-core';
import { firstText, pickTranslation, toDatePrecision, toIsoDate } from '../common/localize';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AwardDto,
  AwardsQueryDto,
  QuizQueryDto,
  QuizQuestionDto,
  TimelineEventDto,
  TimelineQueryDto,
  TriviaDto,
  TriviaQueryDto,
} from './catalog.dto';

interface Page<T> {
  items: T[];
  pagination: PageMeta;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /* ---------------------------------------------------------- Cronologia */

  async timeline(query: TimelineQueryDto): Promise<Page<TimelineEventDto>> {
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T00:00:00.000Z`) : undefined;

    if (from && to && from > to) {
      throw new BadRequestException('El parametro "from" es posterior a "to".');
    }

    const where = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.memberSlug ? { member: { slug: query.memberSlug } } : {}),
      ...query.verifiedFilter,
      ...(from || to
        ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.timelineEvent.count({ where }),
      this.prisma.timelineEvent.findMany({
        where,
        orderBy: [{ date: 'asc' }, { importance: 'desc' }],
        skip: query.skip,
        take: query.limit,
        include: { translations: true, member: { select: { slug: true } } },
      }),
    ]);

    return {
      items: rows.map((row): TimelineEventDto => {
        const t = pickTranslation(row.translations, query.locale);
        return {
          id: row.id,
          date: toIsoDate(row.date) ?? '',
          datePrecision: toDatePrecision(row.datePrecision),
          title: firstText(t?.title, row.title) ?? row.title,
          description: firstText(t?.description, row.description),
          category: row.category,
          importance: row.importance,
          memberSlug: row.member?.slug ?? null,
          imageUrl: row.imageUrl,
          source: row.source,
          verified: row.verified,
        };
      }),
      pagination: buildPageMeta(total, query.page, query.limit),
    };
  }

  /* -------------------------------------------------------- Curiosidades */

  async trivia(query: TriviaQueryDto): Promise<Page<TriviaDto>> {
    const where = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.memberSlug ? { member: { slug: query.memberSlug } } : {}),
      ...query.verifiedFilter,
    };

    const total = await this.prisma.trivia.count({ where });

    /*
     * La seleccion aleatoria NO usa `ORDER BY random()`: obliga a Postgres a
     * ordenar la tabla entera en cada peticion. Se cuenta primero y se salta
     * un numero aleatorio de filas, que con estos volumenes es una lectura
     * indexada y no un ordenamiento completo.
     */
    const skip = query.random ? randomSkip(total, query.limit) : query.skip;

    const rows = await this.prisma.trivia.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip,
      take: query.limit,
      include: { translations: true, member: { select: { slug: true } } },
    });

    const items = rows.map((row): TriviaDto => {
      const t = pickTranslation(row.translations, query.locale);
      return {
        id: row.id,
        category: row.category,
        content: firstText(t?.content, row.content) ?? row.content,
        source: row.source,
        memberSlug: row.member?.slug ?? null,
        verified: row.verified,
      };
    });

    return {
      items: query.random ? shuffle(items) : items,
      pagination: buildPageMeta(total, query.random ? 1 : query.page, query.limit),
    };
  }

  /* --------------------------------------------------------------- Premios */

  async awards(query: AwardsQueryDto): Promise<Page<AwardDto>> {
    const where = {
      ...(query.year ? { year: query.year } : {}),
      ...(query.wonOnly ? { won: true } : {}),
      ...query.verifiedFilter,
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.award.count({ where }),
      this.prisma.award.findMany({
        where,
        orderBy: [{ year: 'desc' }, { organization: 'asc' }],
        skip: query.skip,
        take: query.limit,
        include: { translations: true },
      }),
    ]);

    return {
      items: rows.map((row): AwardDto => {
        const t = pickTranslation(row.translations, query.locale);
        return {
          id: row.id,
          name: firstText(t?.name, row.name) ?? row.name,
          category: firstText(t?.category, row.category) ?? row.category,
          year: row.year,
          organization: row.organization,
          work: row.work,
          won: row.won,
          source: row.source,
          verified: row.verified,
        };
      }),
      pagination: buildPageMeta(total, query.page, query.limit),
    };
  }

  /* ------------------------------------------------------------------ Quiz */

  async quiz(query: QuizQueryDto): Promise<Page<QuizQuestionDto>> {
    const where = {
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
      // Por defecto el quiz solo pregunta por datos contrastados: corregir a
      // alguien con un dato dudoso es peor que no preguntarlo. La revision
      // interna puede pedir lo demas con includeUnverified.
      ...query.verifiedFilter,
    };

    const total = await this.prisma.quizQuestion.count({ where });
    const skip = query.random ? randomSkip(total, query.limit) : query.skip;

    const rows = await this.prisma.quizQuestion.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip,
      take: query.limit,
      include: { translations: true },
    });

    const items = rows.map((row): QuizQuestionDto => {
      const t = pickTranslation(row.translations, query.locale);
      const options = (t?.options ?? row.options) as string[];

      const base: QuizQuestionDto = {
        id: row.id,
        question: firstText(t?.question, row.question) ?? row.question,
        options,
        difficulty: row.difficulty,
      };

      if (!query.includeAnswers) return base;

      return {
        ...base,
        correctIndex: row.correctIndex,
        explanation: firstText(t?.explanation, row.explanation),
      };
    });

    return {
      items: query.random ? shuffle(items) : items,
      pagination: buildPageMeta(total, query.random ? 1 : query.page, query.limit),
    };
  }
}

/** Desplazamiento aleatorio que siempre deja sitio para `limit` elementos. */
function randomSkip(total: number, limit: number): number {
  const room = Math.max(0, total - limit);
  return room === 0 ? 0 : Math.floor(Math.random() * (room + 1));
}

/** Fisher-Yates. `sort(() => Math.random() - 0.5)` no baraja de forma uniforme. */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
