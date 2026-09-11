import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';

/**
 * El cuerpo del multipart, aparte del fichero.
 *
 * `language` es una PISTA OPCIONAL y casi nunca se manda. Existe para el caso
 * en que el visitante ya ha elegido idioma en el sitio y quiere forzarlo, pero
 * el frontend NO lo envia por defecto: forzar el idioma equivocado no produce
 * un error, produce una transcripcion plausible y falsa. Ver la nota 3 del
 * proveedor.
 */
export class TranscribeBodyDto {
  @ApiPropertyOptional({
    enum: SUPPORTED_LOCALES,
    description:
      'Pista de idioma. Sin ella lo detecta el modelo, que es lo recomendado: ' +
      'forzar un idioma equivocado devuelve texto plausible y erroneo, no un error.',
  })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  language?: Locale;
}

/** Lo que se devuelve. Va dentro del envelope `{data, meta, error}`. */
export class TranscriptionDto {
  @ApiProperty({ description: 'Texto reconocido, en su idioma original.' })
  text!: string;

  @ApiProperty({ enum: SUPPORTED_LOCALES, description: 'Idioma detectado por el modelo.' })
  detectedLanguage!: Locale;

  @ApiProperty({
    minimum: 0,
    maximum: 1,
    description:
      'Estimacion, NO una probabilidad calibrada. Deriva de la verosimilitud media ' +
      'por segmento que informa el modelo, penalizada por la probabilidad de silencio. ' +
      'Sirve para decidir si conviene revisar el texto, no para afirmar nada.',
  })
  confidence!: number;

  @ApiProperty({ description: 'Duracion del audio en segundos, segun el proveedor.' })
  durationSec!: number;
}
