// Respuestas de las playlists.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmbedTargetDto {
  @ApiProperty({ description: 'Identificador en la plataforma.' }) id!: string;
  @ApiProperty({ description: 'URL del reproductor incrustable, para un iframe.' })
  embedUrl!: string;
  @ApiProperty({ description: 'URL para abrir la cancion en la plataforma.' }) watchUrl!: string;
}

export class PlaylistEntryDtoSchema {
  @ApiProperty() position!: number;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) subtitle!: string | null;
  @ApiProperty({ nullable: true }) durationSec!: number | null;
  @ApiProperty({ type: EmbedTargetDto, nullable: true }) spotify!: EmbedTargetDto | null;
  @ApiProperty({ description: 'false si aun no hay reproductor oficial disponible.' })
  playable!: boolean;
}

export class PlaylistSummaryDtoSchema {
  @ApiProperty({ example: 'debut-era' }) slug!: string;
  @ApiProperty({ example: 'Debut Era' }) title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() trackCount!: number;
  @ApiProperty({
    enum: ['derived', 'curated'],
    description:
      'derived: la seleccion sale de un criterio comprobable en los datos. curated: es un juicio editorial del sitio.',
  })
  basis!: 'derived' | 'curated';
}

export class PlaylistDetailDtoSchema extends PlaylistSummaryDtoSchema {
  @ApiProperty({ type: [PlaylistEntryDtoSchema] }) entries!: PlaylistEntryDtoSchema[];
  @ApiProperty({ description: 'Cuantas entradas tienen reproductor oficial.' })
  playableCount!: number;
  @ApiProperty({ nullable: true, description: 'Por que la lista no es reproducible.' })
  note!: string | null;
}

export class TrackEmbedAlbumDto {
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty() year!: number;
}

export class TrackEmbedDtoSchema {
  @ApiProperty() trackId!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ type: TrackEmbedAlbumDto, nullable: true })
  album!: TrackEmbedAlbumDto | null;
  @ApiProperty({ type: EmbedTargetDto, nullable: true }) spotify!: EmbedTargetDto | null;
  @ApiProperty({ description: 'false si no se conoce ningun identificador oficial.' })
  available!: boolean;
  @ApiPropertyOptional({ nullable: true }) note!: string | null;
}
