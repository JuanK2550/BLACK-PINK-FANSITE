import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginatedContentQueryDto, toBooleanQuery } from '@blackpink/service-core';
import type {
  DatePrecision,
  QuizDifficulty,
  TimelineCategory,
  TriviaCategory,
} from '@blackpink/types';

export const TIMELINE_CATEGORIES = [
  'DEBUT',
  'COMEBACK',
  'AWARD',
  'TOUR',
  'RECORD',
  'SOLO',
  'OTHER',
] as const;

export const TRIVIA_CATEGORIES = [
  'GROUP',
  'MEMBER',
  'MUSIC',
  'RECORD',
  'FANDOM',
  'STAGE',
  'OTHER',
] as const;

export const QUIZ_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

/* ==========================================================================
 * Cronologia
 * ======================================================================= */

export class TimelineQueryDto extends PaginatedContentQueryDto {
  @ApiPropertyOptional({ enum: TIMELINE_CATEGORIES })
  @IsOptional()
  @IsIn(TIMELINE_CATEGORIES, {
    message: `category debe ser uno de: ${TIMELINE_CATEGORIES.join(', ')}.`,
  })
  category?: (typeof TIMELINE_CATEGORIES)[number];

  @ApiPropertyOptional({ example: '2016-01-01', description: 'Fecha inicial, inclusive.' })
  @IsOptional()
  @IsDateString({}, { message: 'from debe ser una fecha ISO (YYYY-MM-DD).' })
  from?: string;

  @ApiPropertyOptional({ example: '2023-12-31', description: 'Fecha final, inclusive.' })
  @IsOptional()
  @IsDateString({}, { message: 'to debe ser una fecha ISO (YYYY-MM-DD).' })
  to?: string;

  @ApiPropertyOptional({ example: 'jennie', description: 'Solo hitos de una integrante.' })
  @IsOptional()
  memberSlug?: string;
}

export class TimelineEventDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: '2016-08-08' }) date!: string;
  @ApiProperty({
    enum: ['day', 'month', 'year'],
    description:
      'Precision real de la fecha. "month" significa que el dia guardado no es informacion, es relleno.',
  })
  datePrecision!: DatePrecision;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ enum: TIMELINE_CATEGORIES }) category!: TimelineCategory;
  @ApiProperty({ minimum: 1, maximum: 5 }) importance!: number;
  @ApiProperty({ nullable: true }) memberSlug!: string | null;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;
  @ApiProperty({ description: 'De donde sale el dato.', nullable: true }) source!: string | null;
  @ApiProperty() verified!: boolean;
}

/* ==========================================================================
 * Curiosidades
 * ======================================================================= */

export class TriviaQueryDto extends PaginatedContentQueryDto {
  @ApiPropertyOptional({ enum: TRIVIA_CATEGORIES })
  @IsOptional()
  @IsIn(TRIVIA_CATEGORIES, {
    message: `category debe ser uno de: ${TRIVIA_CATEGORIES.join(', ')}.`,
  })
  category?: (typeof TRIVIA_CATEGORIES)[number];

  @ApiPropertyOptional({ example: 'lisa' })
  @IsOptional()
  memberSlug?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Devuelve una seleccion aleatoria en lugar de una pagina. Con random=true, page se ignora.',
  })
  @IsOptional()
  @Transform(toBooleanQuery)
  @IsBoolean({ message: 'random debe ser true o false.' })
  random: boolean = false;
}

export class TriviaDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: TRIVIA_CATEGORIES }) category!: TriviaCategory;
  @ApiProperty() content!: string;
  @ApiProperty({ description: 'De donde sale el dato. Nunca esta vacio.' }) source!: string;
  @ApiProperty({ nullable: true }) memberSlug!: string | null;
  @ApiProperty() verified!: boolean;
}

/* ==========================================================================
 * Premios
 * ======================================================================= */

export class AwardsQueryDto extends PaginatedContentQueryDto {
  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'year debe ser un numero entero.' })
  @Min(2016, { message: 'El grupo debuto en 2016.' })
  @Max(2100, { message: 'year no es una fecha plausible.' })
  year?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Solo los premios ganados, dejando fuera las nominaciones.',
  })
  @IsOptional()
  @Transform(toBooleanQuery)
  @IsBoolean({ message: 'wonOnly debe ser true o false.' })
  wonOnly: boolean = false;
}

export class AwardDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() category!: string;
  @ApiProperty({ description: 'Ano de la ceremonia, no de la obra premiada.' }) year!: number;
  @ApiProperty() organization!: string;
  @ApiProperty({ nullable: true, description: 'Obra premiada, si el premio va por una.' })
  work!: string | null;
  @ApiProperty({ description: 'true = ganado, false = nominado.' }) won!: boolean;
  @ApiProperty({ nullable: true }) source!: string | null;
  @ApiProperty() verified!: boolean;
}

/* ==========================================================================
 * Quiz
 * ======================================================================= */

export class QuizQueryDto extends PaginatedContentQueryDto {
  @ApiPropertyOptional({ enum: QUIZ_DIFFICULTIES })
  @IsOptional()
  @IsIn(QUIZ_DIFFICULTIES, {
    message: `difficulty debe ser uno de: ${QUIZ_DIFFICULTIES.join(', ')}.`,
  })
  difficulty?: (typeof QUIZ_DIFFICULTIES)[number];

  @ApiPropertyOptional({
    default: false,
    description: 'Baraja las preguntas en lugar de devolverlas siempre en el mismo orden.',
  })
  @IsOptional()
  @Transform(toBooleanQuery)
  @IsBoolean({ message: 'random debe ser true o false.' })
  random: boolean = false;

  @ApiPropertyOptional({
    default: true,
    description:
      'Incluye correctIndex y explanation. Ponlo a false para servir el cuestionario a un cliente que no deba conocer la respuesta.',
  })
  @IsOptional()
  @Transform(toBooleanQuery)
  @IsBoolean({ message: 'includeAnswers debe ser true o false.' })
  includeAnswers: boolean = true;
}

export class QuizQuestionDto {
  @ApiProperty() id!: string;
  @ApiProperty() question!: string;
  @ApiProperty({ type: [String], example: ['2014', '2015', '2016', '2017'] }) options!: string[];
  @ApiProperty({ enum: QUIZ_DIFFICULTIES }) difficulty!: QuizDifficulty;
  @ApiPropertyOptional({ description: 'Solo si includeAnswers=true.' }) correctIndex?: number;
  @ApiPropertyOptional({ description: 'Solo si includeAnswers=true.' }) explanation?: string | null;
}
