import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { SpeechThrottlerGuard } from './speech-throttler.guard';
import { TranscribeBodyDto, TranscriptionDto } from './transcribe.dto';
import { TranscribeService } from './transcribe.service';

/**
 * ============================================================================
 * /api/v1/transcribe
 * ============================================================================
 * Recibe un audio y devuelve texto. Nada mas: no conversa, no guarda y no
 * decide que hacer con lo que ha oido. El texto vuelve al navegador, el
 * visitante lo revisa, y si lo envia entra en el chat por la puerta de
 * siempre.
 *
 * ESE RODEO ES DELIBERADO Y ES UNA DECISION DE SEGURIDAD, no de comodidad.
 * Si este servicio llamase al chatbot directamente, la transcripcion seria una
 * entrada que no ha pasado por el filtro de la Fase 9 -o habria que repetir
 * ese filtro aqui, y un filtro duplicado es un filtro del que divergir-. Yendo
 * por el mismo `POST /chat` que el texto escrito, un audio que diga «ignora
 * tus instrucciones» se topa exactamente con las mismas reglas. Hay un test
 * que lo fija.
 *
 * EL LIMITE ES AGRESIVO -10 cada 10 minutos por IP- porque cada llamada cuesta
 * cuota compartida y porque nadie usa un dictado diez veces en diez minutos de
 * forma legitima. No confundir con la cuota del proveedor: ver el guardian.
 * ============================================================================
 */
@ApiTags('speech')
@Controller('transcribe')
export class TranscribeController {
  constructor(private readonly transcribe: TranscribeService) {}

  @Post()
  @UseGuards(SpeechThrottlerGuard)
  @Throttle({ speech: {} })
  /*
   * `memoryStorage` es el valor por defecto de multer y aqui es una decision,
   * no una omision: con `diskStorage` el audio de un visitante quedaria
   * escrito en el disco del servidor a la espera de que alguien se acuerde de
   * borrarlo. El limite de tamano se declara TAMBIEN aqui, no solo en el
   * servicio: multer corta el flujo al superarlo, asi que un fichero de 500 MB
   * no llega a ocupar 500 MB de memoria antes de que nadie lo mire.
   */
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: { fileSize: Number(process.env.MAX_AUDIO_MB ?? 10) * 1024 * 1024, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['audio'],
      properties: {
        audio: { type: 'string', format: 'binary', description: 'webm, ogg, wav, mp3 o m4a' },
        language: { type: 'string', enum: ['es', 'en', 'ko'] },
      },
    },
  })
  @ApiOperation({
    summary: 'Transcribe un audio. El audio no se almacena en ningun momento.',
    description:
      'El formato se comprueba por los BYTES del fichero, no por su extension ni por el ' +
      'content-type que declare el cliente. Codigos de error: EMPTY_AUDIO, ' +
      'UNSUPPORTED_FORMAT, AUDIO_TOO_LARGE, AUDIO_TOO_LONG, ASR_QUOTA (429), ' +
      'ASR_NOT_CONFIGURED y ASR_UNAVAILABLE (503).',
  })
  // El envelope {data, meta, error} lo pone el interceptor global de
  // service-core: aqui se devuelve el objeto pelado.
  @ApiResponse({ status: 201, type: TranscriptionDto })
  async transcribeAudio(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: TranscribeBodyDto,
    @Req() req: Request,
  ): Promise<TranscriptionDto> {
    // Si el visitante cierra la pestana a mitad, se corta tambien aguas
    // arriba: seguir transcribiendo para nadie gasta cuota que no vuelve.
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    return this.transcribe.transcribe(file, body.language, controller.signal);
  }
}
