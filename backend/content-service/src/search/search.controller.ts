// Endpoint del buscador.

import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CacheService, enveloped } from '@blackpink/service-core';
import { resolveTtl } from '../common/cache-ttl';
import { SearchQueryDto, SearchResultDto } from './search.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller({ path: 'search', version: '1' })
export class SearchController {
  private readonly referenceTtl: number;

  constructor(
    private readonly search: SearchService,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.referenceTtl = Number(config.get('CACHE_TTL_SECONDS') ?? 300);
  }

  @Get()
  @ApiOperation({
    summary: 'Busqueda global',
    description:
      'Busca en integrantes, albumes, canciones y cronologia a la vez. Busca tambien en las traducciones, asi que un termino en coreano encuentra el contenido latino equivalente.',
  })
  @ApiOkResponse({ type: SearchResultDto })
  async run(@Query() query: SearchQueryDto) {
    const key = this.cache.buildKey('search', query.locale, {
      q: query.q.trim().toLowerCase(),
      limit: query.limit,
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('search', this.referenceTtl),
      () => this.search.search(query.q, query.locale, query.limit, query.includeUnverified),
    );

    return enveloped(value, { cached });
  }
}
