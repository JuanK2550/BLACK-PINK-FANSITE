// Parámetros y respuestas del buscador.

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { ContentQueryDto } from '@blackpink/service-core';
import type { SearchHitType } from '@blackpink/types';

export class SearchQueryDto extends ContentQueryDto {
  @ApiProperty({
    example: 'born',
    minLength: 2,
    description: 'Termino de busqueda. Minimo dos caracteres.',
  })
  @IsString({ message: 'q es obligatorio.' })
  @MinLength(2, { message: 'q necesita al menos dos caracteres.' })
  q!: string;

  @ApiPropertyOptional({
    default: 5,
    minimum: 1,
    maximum: 20,
    description: 'Maximo de resultados POR TIPO, no en total.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un numero entero.' })
  @Min(1, { message: 'limit debe ser 1 o mayor.' })
  @Max(20, { message: 'limit no puede pasar de 20.' })
  limit: number = 5;
}

export class SearchHitDto {
  @ApiProperty({ enum: ['member', 'album', 'track', 'timeline'] }) type!: SearchHitType;
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true, description: 'Contexto: el album de una cancion, un ano...' })
  subtitle!: string | null;
  @ApiProperty({ description: 'Ruta relativa dentro del sitio.' }) href!: string;
}

export class SearchResultDto {
  @ApiProperty({ example: 'born' }) query!: string;
  @ApiProperty({ description: 'Suma de todos los tipos.' }) total!: number;
  @ApiProperty({ type: [SearchHitDto] }) members!: SearchHitDto[];
  @ApiProperty({ type: [SearchHitDto] }) albums!: SearchHitDto[];
  @ApiProperty({ type: [SearchHitDto] }) tracks!: SearchHitDto[];
  @ApiProperty({ type: [SearchHitDto] }) timeline!: SearchHitDto[];
}
