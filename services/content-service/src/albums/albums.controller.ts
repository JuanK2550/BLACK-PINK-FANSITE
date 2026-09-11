import { Controller, Get, Param, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CacheService, enveloped, paginated } from '@blackpink/service-core';
import { resolveTtl } from '../common/cache-ttl';
import { AlbumDetailDto, AlbumDetailQueryDto, AlbumsQueryDto, AlbumSummaryDto } from './albums.dto';
import { AlbumsService } from './albums.service';

@ApiTags('albums')
@Controller({ version: '1' })
export class AlbumsController {
  private readonly referenceTtl: number;

  constructor(
    private readonly albums: AlbumsService,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.referenceTtl = Number(config.get('CACHE_TTL_SECONDS') ?? 300);
  }

  @Get('albums')
  @ApiOperation({
    summary: 'Discografia del grupo',
    description: 'Listado paginado con filtro por formato y orden configurable.',
  })
  @ApiOkResponse({ type: [AlbumSummaryDto] })
  async list(@Query() query: AlbumsQueryDto) {
    const key = this.cache.buildKey('albums', query.locale, {
      type: query.type,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('albums', this.referenceTtl),
      () => this.albums.list(query),
    );

    return paginated(value.items, value.pagination, { cached });
  }

  @Get('albums/:slug')
  @ApiOperation({ summary: 'Detalle de un album con su lista de canciones' })
  @ApiParam({ name: 'slug', example: 'born-pink' })
  @ApiOkResponse({ type: AlbumDetailDto })
  @ApiNotFoundResponse({ description: 'No existe, o esta pendiente de contrastar.' })
  async detail(@Param('slug') slug: string, @Query() query: AlbumDetailQueryDto) {
    const key = this.cache.buildKey('album', query.locale, {
      slug,
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('albumDetail', this.referenceTtl),
      () => this.albums.findBySlug(slug, query.locale, query.includeUnverified),
    );

    return enveloped(value, { cached });
  }

  @Get('tracks/:id')
  @ApiOperation({
    summary: 'Detalle de una cancion',
    description:
      'Lo consume media-service para resolver un embed sin tener que descargarse el album entero.',
  })
  @ApiParam({ name: 'id' })
  async track(@Param('id') id: string, @Query() query: AlbumDetailQueryDto) {
    const key = this.cache.buildKey('track', query.locale, {
      id,
      includeUnverified: query.includeUnverified,
    });

    const { value, cached } = await this.cache.getOrSet(
      key,
      resolveTtl('tracks', this.referenceTtl),
      () => this.albums.findTrack(id, query.locale, query.includeUnverified),
    );

    return enveloped(value, { cached });
  }
}
