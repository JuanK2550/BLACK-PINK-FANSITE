import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CacheService, enveloped } from '@blackpink/service-core';
import { ConfigService } from '@nestjs/config';
import { resolveTtl } from '../common/cache-ttl';
import { MemberDetailDto, MembersQueryDto, MemberSummaryDto } from './members.dto';
import { MembersService } from './members.service';

@ApiTags('members')
@Controller({ path: 'members', version: '1' })
export class MembersController {
  private readonly referenceTtl: number;

  constructor(
    private readonly members: MembersService,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.referenceTtl = Number(config.get('CACHE_TTL_SECONDS') ?? 300);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista de integrantes',
    description:
      'Devuelve las integrantes en el orden de presentacion del sitio, con el papel resuelto en el idioma pedido.',
  })
  @ApiOkResponse({ type: [MemberSummaryDto] })
  async list(@Query() query: MembersQueryDto) {
    const key = this.cache.buildKey('members', query.locale, {
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('members', this.referenceTtl),
      () => this.members.list(query.locale, query.includeUnverified),
    );

    return enveloped(value, { cached });
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Ficha completa de una integrante',
    description:
      'Incluye biografia, trabajo en solitario, curiosidades y cronologia propia, todo en el idioma pedido.',
  })
  @ApiParam({ name: 'slug', example: 'jisoo' })
  @ApiOkResponse({ type: MemberDetailDto })
  @ApiNotFoundResponse({ description: 'No existe, o esta pendiente de contrastar.' })
  async detail(@Param('slug') slug: string, @Query() query: MembersQueryDto) {
    const key = this.cache.buildKey('member', query.locale, {
      slug,
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('memberDetail', this.referenceTtl),
      () => this.members.findBySlug(slug, query.locale, query.includeUnverified),
    );

    return enveloped(value, { cached });
  }
}
