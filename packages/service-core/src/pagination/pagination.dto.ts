import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@blackpink/types';

/**
 * Convierte "true"/"false" de la query en booleano real.
 * Sin esto, class-validator recibe la cadena "false", que es un valor
 * verdadero en JavaScript, y el filtro hace justo lo contrario de lo pedido.
 */
export const toBooleanQuery = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

/**
 * Descripcion unica del parametro, para que Swagger diga lo mismo en los ocho
 * endpoints y nadie lo lea como un filtro cualquiera.
 */
const INCLUDE_UNVERIFIED_DESCRIPTION =
  'Incluye tambien los registros con verified=false, es decir, los que aun no se han contrastado contra su fuente. ' +
  'USO INTERNO: sirve para revisar contenido antes de darlo por bueno. El sitio publico NO debe enviarlo nunca.';

/**
 * Query de paginacion comun a todas las colecciones.
 *
 * `limit` tiene un techo duro de 100. Sin el, un `?limit=100000` convierte
 * cualquier listado en una denegacion de servicio gratuita.
 */
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

/** Query de idioma, comun a todo el contenido traducible. */
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

/** Paginacion + idioma, que es lo que necesita casi todo listado. */
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

/**
 * ============================================================================
 * VISIBILIDAD DEL CONTENIDO SIN CONTRASTAR
 * ============================================================================
 * El campo se declara UNA vez y lo heredan todos los endpoints de contenido.
 * Repetirlo en cada DTO es la forma segura de que un dia uno de ellos se
 * quede con el valor por defecto equivocado y empiece a publicar datos sin
 * verificar sin que nadie lo note.
 *
 * Por defecto es `false`: el sitio publica solo lo contrastado. Es una regla
 * del proyecto, no una preferencia.
 * ============================================================================
 */
export class ContentQueryDto extends LocaleQueryDto {
  @ApiPropertyOptional({ default: false, description: INCLUDE_UNVERIFIED_DESCRIPTION })
  @IsOptional()
  @Transform(toBooleanQuery)
  @IsBoolean({ message: 'includeUnverified debe ser true o false.' })
  includeUnverified: boolean = false;

  /** Fragmento de `where` de Prisma segun la visibilidad pedida. */
  get verifiedFilter(): { verified: true } | Record<string, never> {
    return this.includeUnverified ? {} : { verified: true };
  }
}

/** Paginacion + idioma + visibilidad: lo que necesita todo listado de contenido. */
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
