// Endpoint que recibe un audio y devuelve el texto.

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

@ApiTags('speech')
@Controller('transcribe')
export class TranscribeController {
  constructor(private readonly transcribe: TranscribeService) {}

  @Post()
  @UseGuards(SpeechThrottlerGuard)
  @Throttle({ speech: {} })
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
  @ApiResponse({ status: 201, type: TranscriptionDto })
  async transcribeAudio(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: TranscribeBodyDto,
    @Req() req: Request,
  ): Promise<TranscriptionDto> {
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    return this.transcribe.transcribe(file, body.language, controller.signal);
  }
}
