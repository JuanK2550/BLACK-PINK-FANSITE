import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';

/** Tope duro de entrada. Ver la nota del controlador sobre por que 1000. */
export const MAX_MESSAGE_CHARS = 1000;

/** Cuantos turnos previos se aceptan. Mas historia es mas cuota por pregunta. */
export const MAX_HISTORY_TURNS = 10;

export class ChatTurnDto {
  @ApiProperty({ enum: ['user', 'model'] })
  @IsIn(['user', 'model'])
  role!: 'user' | 'model';

  @ApiProperty()
  @IsString()
  @MaxLength(MAX_MESSAGE_CHARS)
  text!: string;
}

export class ChatRequestDto {
  @ApiProperty({ maxLength: MAX_MESSAGE_CHARS })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_MESSAGE_CHARS)
  message!: string;

  @ApiProperty({ description: 'Identificador opaco de sesion. No es un usuario.' })
  @IsString()
  @MaxLength(64)
  sessionId!: string;

  @ApiPropertyOptional({ enum: SUPPORTED_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale?: Locale;

  @ApiPropertyOptional({ type: [ChatTurnDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  history?: ChatTurnDto[];
}

export class SuggestionsQueryDto {
  @ApiPropertyOptional({ enum: SUPPORTED_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale?: Locale;
}
