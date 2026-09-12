// Endpoints de cronología, curiosidades, premios y quiz.

import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CacheService, paginated } from '@blackpink/service-core';
import { resolveTtl } from '../common/cache-ttl';
import {
  AwardDto,
  AwardsQueryDto,
  QuizQuestionDto,
  QuizQueryDto,
  TimelineEventDto,
  TimelineQueryDto,
  TriviaDto,
  TriviaQueryDto,
} from './catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller({ version: '1' })
export class CatalogController {
  private readonly referenceTtl: number;

  constructor(
    private readonly catalog: CatalogService,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.referenceTtl = Number(config.get('CACHE_TTL_SECONDS') ?? 300);
  }

  @Get('timeline')
  @ApiOperation({
    summary: 'Cronologia del grupo',
    description:
      'Hitos ordenados por fecha. Cada uno declara su precision real: "month" significa que el dia es relleno, no informacion.',
  })
  @ApiOkResponse({ type: [TimelineEventDto] })
  async timeline(@Query() query: TimelineQueryDto) {
    const key = this.cache.buildKey('timeline', query.locale, {
      category: query.category,
      from: query.from,
      to: query.to,
      memberSlug: query.memberSlug,
      page: query.page,
      limit: query.limit,
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('timeline', this.referenceTtl),
      () => this.catalog.timeline(query),
    );

    return paginated(value.items, value.pagination, { cached });
  }

  @Get('trivia')
  @ApiOperation({
    summary: 'Curiosidades y records',
    description:
      'Por defecto solo devuelve datos contrastados. Con random=true entrega una seleccion aleatoria en vez de una pagina.',
  })
  @ApiOkResponse({ type: [TriviaDto] })
  async trivia(@Query() query: TriviaQueryDto) {
    if (query.random) {
      const value = await this.catalog.trivia(query);
      return paginated(value.items, value.pagination, { cached: false });
    }

    const key = this.cache.buildKey('trivia', query.locale, {
      category: query.category,
      memberSlug: query.memberSlug,
      page: query.page,
      limit: query.limit,
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('trivia', this.referenceTtl),
      () => this.catalog.trivia(query),
    );

    return paginated(value.items, value.pagination, { cached });
  }

  @Get('awards')
  @ApiOperation({
    summary: 'Premios y nominaciones',
    description:
      'ATENCION: hoy el palmares entero esta pendiente de contrastar, asi que por defecto esta lista sale VACIA. Con includeUnverified=true se ven las seis entradas cargadas, para poder revisarlas.',
  })
  @ApiOkResponse({ type: [AwardDto] })
  async awards(@Query() query: AwardsQueryDto) {
    const key = this.cache.buildKey('awards', query.locale, {
      year: query.year,
      wonOnly: query.wonOnly,
      page: query.page,
      limit: query.limit,
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('awards', this.referenceTtl),
      () => this.catalog.awards(query),
    );

    return paginated(value.items, value.pagination, { cached });
  }

  @Get('quiz/questions')
  @ApiOperation({
    summary: 'Preguntas del quiz',
    description:
      'Solo preguntas construidas sobre datos contrastados. includeAnswers=false sirve el cuestionario sin la respuesta correcta.',
  })
  @ApiOkResponse({ type: [QuizQuestionDto] })
  async quiz(@Query() query: QuizQueryDto) {
    if (query.random) {
      const value = await this.catalog.quiz(query);
      return paginated(value.items, value.pagination, { cached: false });
    }

    const key = this.cache.buildKey('quiz', query.locale, {
      difficulty: query.difficulty,
      page: query.page,
      limit: query.limit,
      includeAnswers: query.includeAnswers,
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('quiz', this.referenceTtl),
      () => this.catalog.quiz(query),
    );

    return paginated(value.items, value.pagination, { cached });
  }
}
