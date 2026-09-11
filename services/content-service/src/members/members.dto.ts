import { ApiProperty } from '@nestjs/swagger';
import { ContentQueryDto } from '@blackpink/service-core';
import type {
  DatePrecision,
  SoloWorkType,
  TimelineCategory,
  TriviaCategory,
} from '@blackpink/types';

/**
 * Hereda `locale` e `includeUnverified` de ContentQueryDto: el valor por
 * defecto de la visibilidad se decide en un unico sitio.
 */
export class MembersQueryDto extends ContentQueryDto {}

/* ==========================================================================
 * Respuestas
 * ======================================================================= */

export class MemberSummaryDto {
  @ApiProperty({ example: 'jisoo' }) slug!: string;
  @ApiProperty({ example: 'JISOO' }) stageName!: string;
  @ApiProperty({ example: 'Kim Ji-soo' }) fullName!: string;
  @ApiProperty({ example: '김지수', nullable: true }) koreanName!: string | null;
  @ApiProperty({ example: 'Vocalista', description: 'Papel en el idioma pedido.' })
  position!: string;
  @ApiProperty({ example: 'Corea del Sur' }) nationality!: string;
  @ApiProperty({ example: '1995-01-03', nullable: true }) birthDate!: string | null;
  @ApiProperty({ example: '#c9a7ff', nullable: true }) colorAccent!: string | null;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;

  /* La foto y su atribucion viajan juntas: ver la nota del contrato. */
  @ApiProperty({ nullable: true, example: 960 }) imageWidth!: number | null;
  @ApiProperty({ nullable: true, example: 1311 }) imageHeight!: number | null;
  @ApiProperty({ nullable: true, example: 'K-POPIT 케이팝잇' }) imageAuthor!: string | null;
  @ApiProperty({ nullable: true, example: 'CC BY 3.0' }) imageLicense!: string | null;
  @ApiProperty({ nullable: true }) imageLicenseUrl!: string | null;
  @ApiProperty({ nullable: true, description: 'Pagina de origen e indicacion de cambios.' })
  imageSource!: string | null;
  @ApiProperty({ nullable: true, example: '2024-02-26' }) imageDate!: string | null;
  @ApiProperty({ nullable: true, example: '50% 28%' }) imageFocus!: string | null;
  @ApiProperty({ nullable: true, description: 'Alt en el idioma pedido.' })
  imageAlt!: string | null;

  @ApiProperty({ description: 'false = dato pendiente de contrastar.' }) verified!: boolean;
}

export class SoloTrackDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() trackNumber!: number;
  @ApiProperty({ nullable: true }) durationSec!: number | null;
  @ApiProperty() isTitleTrack!: boolean;
  @ApiProperty({ nullable: true, example: 'Dua Lipa' }) featuring!: string | null;
  @ApiProperty({ nullable: true }) spotifyId!: string | null;
  @ApiProperty() verified!: boolean;
}

export class SoloWorkDto {
  @ApiProperty() slug!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: ['SINGLE', 'EP', 'ALBUM', 'COLLABORATION', 'OST', 'OTHER'] })
  type!: SoloWorkType;
  @ApiProperty({ example: '2018-11-12' }) releaseDate!: string;
  @ApiProperty({ nullable: true }) formatLabel!: string | null;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ nullable: true }) coverUrl!: string | null;
  @ApiProperty({ nullable: true }) coverWidth!: number | null;
  @ApiProperty({ nullable: true }) coverHeight!: number | null;
  @ApiProperty({ nullable: true }) coverThumbUrl!: string | null;
  @ApiProperty({ nullable: true }) coverThumbWidth!: number | null;
  @ApiProperty({ nullable: true }) coverThumbHeight!: number | null;
  @ApiProperty({ nullable: true }) durationSec!: number | null;
  @ApiProperty({ nullable: true }) spotifyId!: string | null;
  @ApiProperty() verified!: boolean;
  @ApiProperty({ type: [SoloTrackDto] }) tracks!: SoloTrackDto[];
}

export class MemberTriviaDto {
  @ApiProperty() id!: string;
  @ApiProperty() category!: TriviaCategory;
  @ApiProperty() content!: string;
  @ApiProperty({ description: 'De donde sale el dato.' }) source!: string;
  @ApiProperty() verified!: boolean;
}

export class MemberTimelineDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: '2018-11-12' }) date!: string;
  @ApiProperty({ enum: ['day', 'month', 'year'] }) datePrecision!: DatePrecision;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty() category!: TimelineCategory;
  @ApiProperty({ minimum: 1, maximum: 5 }) importance!: number;
  @ApiProperty() verified!: boolean;
}

export class MemberDetailDto extends MemberSummaryDto {
  @ApiProperty({ nullable: true }) nickname!: string | null;
  @ApiProperty({ nullable: true }) bio!: string | null;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({
    nullable: true,
    description: 'Cuentas publicas oficiales. Nunca informacion personal privada.',
    example: { instagram: 'https://www.instagram.com/sooyaaa__/' },
  })
  socials!: Record<string, string> | null;
  @ApiProperty({ type: [SoloWorkDto] }) soloWorks!: SoloWorkDto[];
  @ApiProperty({ type: [MemberTriviaDto] }) trivia!: MemberTriviaDto[];
  @ApiProperty({ type: [MemberTimelineDto] }) timeline!: MemberTimelineDto[];
}
