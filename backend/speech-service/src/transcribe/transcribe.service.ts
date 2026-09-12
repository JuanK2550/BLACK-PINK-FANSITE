// Valida el audio y lo transcribe sin guardarlo.

import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Locale } from '@blackpink/types';
import { ASR_PROVIDER, AsrError, type AsrProvider } from '../provider/asr-provider';
import { probeDurationSec, sniffAudio } from './audio.validation';

export interface TranscriptionOutcome {
  text: string;
  detectedLanguage: Locale;
  confidence: number;
  durationSec: number;
}

@Injectable()
export class TranscribeService {
  private readonly logger = new Logger(TranscribeService.name);

  private readonly maxBytes: number;
  private readonly maxSeconds: number;

  constructor(
    @Inject(ASR_PROVIDER) private readonly provider: AsrProvider,
    config: ConfigService,
  ) {
    this.maxBytes = Number(config.get<string>('MAX_AUDIO_MB') ?? 10) * 1024 * 1024;
    this.maxSeconds = Number(config.get<string>('MAX_AUDIO_SECONDS') ?? 60);
  }

  describeProvider(): string {
    return this.provider.describe();
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  async transcribe(
    file: { buffer: Buffer; originalname?: string; mimetype?: string } | undefined,
    language: Locale | undefined,
    signal?: AbortSignal,
  ): Promise<TranscriptionOutcome> {
    if (!file || file.buffer.length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_AUDIO',
        message: 'No llego ningun audio.',
      });
    }

    if (file.buffer.length > this.maxBytes) {
      throw new PayloadTooLargeException({
        code: 'AUDIO_TOO_LARGE',
        message: `El audio supera el maximo de ${Math.round(this.maxBytes / 1024 / 1024)} MB.`,
      });
    }

    const sniffed = sniffAudio(file.buffer);
    if (!sniffed) {
      throw new BadRequestException({
        code: 'UNSUPPORTED_FORMAT',
        message: 'Formato de audio no admitido. Se aceptan webm, ogg, wav, mp3 y m4a.',
        declared: file.mimetype ?? null,
      });
    }

    const probed = probeDurationSec(file.buffer, sniffed.format);
    if (probed !== null && probed > this.maxSeconds + 1) {
      throw new BadRequestException({
        code: 'AUDIO_TOO_LONG',
        message: `El audio dura ${Math.round(probed)}s y el maximo es ${this.maxSeconds}s.`,
      });
    }

    let result;
    try {
      result = await this.provider.transcribe(
        {
          audio: file.buffer,
          filename: `audio.${sniffed.extension}`,
          mimeType: sniffed.mime,
          language,
        },
        signal,
      );
    } catch (error) {
      throw this.translate(error);
    }

    if (result.durationSec > this.maxSeconds + 1) {
      throw new BadRequestException({
        code: 'AUDIO_TOO_LONG',
        message: `El audio dura ${Math.round(result.durationSec)}s y el maximo es ${this.maxSeconds}s.`,
      });
    }

    this.logger.log(
      `transcrito ${sniffed.format} ${Math.round(file.buffer.length / 1024)}KB ` +
        `${result.durationSec}s -> ${result.detectedLanguage} (${result.confidence})`,
    );

    return result;
  }

  private translate(error: unknown): HttpException {
    if (!(error instanceof AsrError)) {
      this.logger.error(`fallo inesperado al transcribir: ${String(error)}`);
      return new ServiceUnavailableException({
        code: 'ASR_UNAVAILABLE',
        message: 'El servicio de transcripcion no esta disponible.',
      });
    }

    switch (error.kind) {
      case 'empty_audio':
        return new BadRequestException({
          code: 'EMPTY_AUDIO',
          message: 'No se ha reconocido voz en el audio.',
        });

      case 'quota':
        return new HttpException(
          {
            code: 'ASR_QUOTA',
            message: 'Se ha agotado la cuota de transcripcion. Vuelve a intentarlo en un rato.',
            retryAfterSec: error.retryAfterSec ?? null,
          },
          429,
        );

      case 'not_configured':
        return new ServiceUnavailableException({
          code: 'ASR_NOT_CONFIGURED',
          message: 'La transcripcion no esta disponible en este momento.',
        });

      case 'aborted':
        return new BadRequestException({
          code: 'ASR_ABORTED',
          message: 'Transcripcion cancelada.',
        });

      default:
        return new ServiceUnavailableException({
          code: 'ASR_UNAVAILABLE',
          message: 'El servicio de transcripcion no responde. Intentalo de nuevo.',
        });
    }
  }
}
