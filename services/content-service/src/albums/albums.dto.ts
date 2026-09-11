import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ContentQueryDto, PaginatedContentQueryDto } from '@blackpink/service-core';
import type { AlbumType } from '@blackpink/types';

export const ALBUM_TYPES = ['SINGLE', 'EP', 'ALBUM', 'COMPILATION', 'COLLABORATION'] as const;

/**
 * Orden como un unico parametro `campo_direccion` en vez de `sort` + `order`.
 * Con dos parametros hay combinaciones invalidas que hay que validar por
 * separado; con uno, el conjunto de valores validos es la propia lista.
 */
export const ALBUM_SORTS = [
  'releaseDate_desc',
  'releaseDate_asc',
  'title_asc',
  'title_desc',
] as const;

export type AlbumSort = (typeof ALBUM_SORTS)[number];

export class AlbumsQueryDto extends PaginatedContentQueryDto {
  @ApiPropertyOptional({ enum: ALBUM_TYPES, description: 'Filtra por formato de lanzamiento.' })
  @IsOptional()
  @IsIn(ALBUM_TYPES, { message: `type debe ser uno de: ${ALBUM_TYPES.join(', ')}.` })
  type?: (typeof ALBUM_TYPES)[number];

  @ApiPropertyOptional({ enum: ALBUM_SORTS, default: 'releaseDate_desc' })
  @IsOptional()
  @IsIn(ALBUM_SORTS, { message: `sort debe ser uno de: ${ALBUM_SORTS.join(', ')}.` })
  sort: AlbumSort = 'releaseDate_desc';
}

/** Detalle de un album o de una cancion: idioma y visibilidad, sin paginacion. */
export class AlbumDetailQueryDto extends ContentQueryDto {}

/* ==========================================================================
 * Respuestas
 * ======================================================================= */

export class TrackDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'Whistle' }) title!: string;
  @ApiProperty({ example: 1 }) trackNumber!: number;
  @ApiProperty({
    nullable: true,
    description: 'Null hasta que media-service lo resuelva contra la API oficial.',
  })
  durationSec!: number | null;
  @ApiProperty() isTitleTrack!: boolean;
  @ApiProperty({ nullable: true, example: '휘파람', description: 'Titulo en el idioma pedido.' })
  localizedTitle!: string | null;
  @ApiProperty({
    nullable: true,
    description: 'Identificador para el reproductor OFICIAL. El sitio no sirve audio.',
  })
  spotifyId!: string | null;
  @ApiProperty() lyricsAvailable!: boolean;
  @ApiProperty() verified!: boolean;
}

export class AlbumSummaryDto {
  @ApiProperty({ example: 'born-pink' }) slug!: string;
  @ApiProperty({ example: 'BORN PINK' }) title!: string;
  @ApiProperty({ enum: ALBUM_TYPES }) type!: AlbumType;
  @ApiProperty({ example: '2022-09-16' }) releaseDate!: string;
  @ApiProperty({ example: 2022 }) year!: number;
  @ApiProperty({ nullable: true, example: 'Album de estudio' }) formatLabel!: string | null;
  @ApiProperty({ nullable: true }) label!: string | null;
  @ApiProperty({ nullable: true }) coverUrl!: string | null;
  @ApiProperty({ nullable: true }) coverWidth!: number | null;
  @ApiProperty({ nullable: true }) coverHeight!: number | null;
  @ApiProperty({ nullable: true }) coverThumbUrl!: string | null;
  @ApiProperty({ nullable: true }) coverThumbWidth!: number | null;
  @ApiProperty({ nullable: true }) coverThumbHeight!: number | null;
  @ApiProperty() trackCount!: number;
  @ApiProperty() verified!: boolean;
}

export class AlbumDetailDto extends AlbumSummaryDto {
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ nullable: true }) spotifyId!: string | null;
  @ApiProperty({ type: [TrackDto] }) tracks!: TrackDto[];
}
