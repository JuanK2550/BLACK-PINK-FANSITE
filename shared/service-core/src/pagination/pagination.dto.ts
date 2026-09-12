// Parámetros comunes: idioma, página y contenido sin verificar.

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@blackpink/types';

export const toBooleanQuery = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

const INCLUDE_UNVERIFIED_DESCRIPTION =
  'Incluye tambien los registros con verified=false, es decir, los que aun no se han contrastado contra su fuente. ' +
  'USO INTERNO: sirve para revisar contenido antes de darlo por bueno. El sitio publico NO debe enviarlo nunca.';

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Pagina, empezando en 1.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un numero entero.' })
  @Min(1, { message: 'page debe ser 1 o mayor.' })
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Elementos por pagina. Maximo 100.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un numero entero.' })
  @Min(1, { message: 'limit debe ser 1 o mayor.' })
  @Max(100, { message: 'limit no puede pasar de 100.' })
  limit: number = 20;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export class LocaleQueryDto {
  @ApiPropertyOptional({
    enum: SUPPORTED_LOCALES,
    default: DEFAULT_LOCALE,
    description: 'Idioma en el que se resuelve el contenido traducible.',
  })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES, {
    message: `locale debe ser uno de: ${SUPPORTED_LOCALES.join(', ')}.`,
  })
  locale: Locale = DEFAULT_LOCALE;
}

export class PaginatedLocaleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: SUPPORTED_LOCALES,
    default: DEFAULT_LOCALE,
    description: 'Idioma en el que se resuelve el contenido traducible.',
  })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES, {
    message: `locale debe ser uno de: ${SUPPORTED_LOCALES.join(', ')}.`,
  })
  locale: Locale = DEFAULT_LOCALE;
}

export class ContentQueryDto extends LocaleQueryDto {
  @ApiPropertyOptional({ default: false, description: INCLUDE_UNVERIFIED_DESCRIPTION })
  @IsOptional()
  @Transform(toBooleanQuery)
  @IsBoolean({ message: 'includeUnverified debe ser true o false.' })
  includeUnverified: boolean = false;

  get verifiedFilter(): { verified: true } | Record<string, never> {
    return this.includeUnverified ? {} : { verified: true };
  }
}

export class PaginatedContentQueryDto extends PaginatedLocaleQueryDto {
  @ApiPropertyOptional({ default: false, description: INCLUDE_UNVERIFIED_DESCRIPTION })
  @IsOptional()
  @Transform(toBooleanQuery)
  @IsBoolean({ message: 'includeUnverified debe ser true o false.' })
  includeUnverified: boolean = false;

  get verifiedFilter(): { verified: true } | Record<string, never> {
    return this.includeUnverified ? {} : { verified: true };
  }
}
