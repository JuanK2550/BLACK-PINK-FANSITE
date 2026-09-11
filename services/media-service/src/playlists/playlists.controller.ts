import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CacheService, LocaleQueryDto, enveloped } from '@blackpink/service-core';
import { EmbedsService } from '../embeds/embeds.service';
import {
  PlaylistDetailDtoSchema,
  PlaylistSummaryDtoSchema,
  TrackEmbedDtoSchema,
} from './playlists.dto';
import { PlaylistsService } from './playlists.service';

@ApiTags('playlists')
@Controller({ version: '1' })
export class PlaylistsController {
  constructor(
    private readonly playlists: PlaylistsService,
    private readonly embeds: EmbedsService,
    private readonly cache: CacheService,
  ) {}

  @Get('playlists')
  @ApiOperation({
    summary: 'Playlists curadas',
    description:
      'Listas tematicas mantenidas por este sitio. No se sirve audio: cada entrada lleva los identificadores para incrustar los reproductores oficiales.',
  })
  @ApiOkResponse({ type: [PlaylistSummaryDtoSchema] })
  list(@Query() query: LocaleQueryDto) {
    // La lista es contenido estatico en memoria: cachearla en Redis anadiria
    // un viaje de red para evitar un `Array.map`.
    return enveloped(this.playlists.list(query.locale), { cached: false });
  }

  @Get('playlists/:slug')
  @ApiOperation({
    summary: 'Detalle de una playlist con sus canciones resueltas',
    description:
      'Resuelve cada referencia contra content-service y devuelve los datos de embed. `playable` dice si hay reproductor oficial disponible.',
  })
  @ApiParam({ name: 'slug', example: 'debut' })
  @ApiOkResponse({ type: PlaylistDetailDtoSchema })
  @ApiNotFoundResponse({ description: 'No existe ninguna playlist con ese identificador.' })
  async detail(@Param('slug') slug: string, @Query() query: LocaleQueryDto) {
    const key = this.cache.buildKey('playlist', query.locale, { slug });

    const { value, cached } = await this.cache.getOrSet(key, 600, () =>
      this.playlists.findBySlug(slug, query.locale),
    );

    return enveloped(value, { cached });
  }

  @Get('tracks/:id/embed')
  @ApiOperation({
    summary: 'Datos de embed oficial de una cancion',
    description:
      'Devuelve la URL del reproductor incrustable de Spotify. NUNCA devuelve un archivo de audio: este servicio no aloja media con copyright.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la cancion en content-service.' })
  @ApiOkResponse({ type: TrackEmbedDtoSchema })
  @ApiNotFoundResponse({ description: 'No existe esa cancion, o no esta contrastada.' })
  async embed(@Param('id') id: string, @Query() query: LocaleQueryDto) {
    const key = this.cache.buildKey('embed', query.locale, { id });

    const { value, cached } = await this.cache.getOrSet(key, 600, () =>
      this.embeds.forTrack(id, query.locale),
    );

    return enveloped(value, { cached });
  }
}
