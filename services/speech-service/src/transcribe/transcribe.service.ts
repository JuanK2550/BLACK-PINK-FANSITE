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

/**
 * ============================================================================
 * TRANSCRIBIR UN AUDIO
 * ============================================================================
 * El orden de las comprobaciones no es casual: primero lo que se puede saber
 * sin salir de este proceso -que haya bytes, que sean de un formato conocido,
 * que quepan, que no sea demasiado largo- y solo despues se gasta una llamada
 * al proveedor. Al reves, un fichero vacio consumiria cuota antes de que nadie
 * mirase si tenia contenido.
 *
 * EL AUDIO NO TOCA EL DISCO. Multer esta configurado en memoria, el multipart
 * hacia el proveedor se monta en memoria, y al volver de esta funcion el
 * buffer queda sin referencias. No hay `unlink` que llamar porque no hay
 * fichero: la unica forma segura de no dejar audio de nadie es no escribirlo.
 *
 * Y NO SE REGISTRA NI EL AUDIO NI EL TEXTO. Los logs llevan formato, tamano y
 * duracion; nunca lo que se dijo. Es la misma regla que el log de auditoria
 * del chatbot: el contenido es justo donde apareceria un dato personal.
 * ============================================================================
 */

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
    /* ------------------------------------------------- 1. hay algo? --- */
    if (!file || file.buffer.length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_AUDIO',
        message: 'No llego ningun audio.',
      });
    }

    /* --------------------------------------------------- 2. cabe? ---- */
    if (file.buffer.length > this.maxBytes) {
      throw new PayloadTooLargeException({
        code: 'AUDIO_TOO_LARGE',
        message: `El audio supera el maximo de ${Math.round(this.maxBytes / 1024 / 1024)} MB.`,
      });
    }

    /* ------------------------------------- 3. es lo que dice ser? ---- */
    const sniffed = sniffAudio(file.buffer);
    if (!sniffed) {
      // El `content-type` que declaro el cliente solo aparece aqui, en el
      // mensaje, para que quien depure vea la discrepancia. No se ha usado
      // para decidir nada.
      throw new BadRequestException({
        code: 'UNSUPPORTED_FORMAT',
        message: 'Formato de audio no admitido. Se aceptan webm, ogg, wav, mp3 y m4a.',
        declared: file.mimetype ?? null,
      });
    }

    /* --------------------------------------------- 4. dura poco? ---- */
    const probed = probeDurationSec(file.buffer, sniffed.format);
    if (probed !== null && probed > this.maxSeconds + 1) {
      throw new BadRequestException({
        code: 'AUDIO_TOO_LONG',
        message: `El audio dura ${Math.round(probed)}s y el maximo es ${this.maxSeconds}s.`,
      });
    }

    /* ------------------------------------------------ 5. transcribir - */
    let result;
    try {
      result = await this.provider.transcribe(
        {
          audio: file.buffer,
          // El nombre se REESCRIBE con la extension deducida de los bytes. El
          // original viene del cliente y es justo lo que no se quiere reenviar
          // -puede traer rutas, caracteres de control o el nombre real de
          // alguien-, y ademas el proveedor elige decodificador por ella: si
          // mintiera, fallaria un audio perfectamente valido.
          filename: `audio.${sniffed.extension}`,
          mimeType: sniffed.mime,
          language,
        },
        signal,
      );
    } catch (error) {
      throw this.translate(error);
    }

    /* ----------------------- 6. duracion real, la que dice el proveedor */
    if (result.durationSec > this.maxSeconds + 1) {
      // Llega tarde -la llamada ya se ha gastado- y es el precio consciente de
      // no escribir tres analizadores de contenedor. Ver `probeDurationSec`.
      // El texto se descarta sin devolverlo: aceptarlo «porque ya esta hecho»
      // convertiria el limite en una sugerencia.
      throw new BadRequestException({
        code: 'AUDIO_TOO_LONG',
        message: `El audio dura ${Math.round(result.durationSec)}s y el maximo es ${this.maxSeconds}s.`,
      });
    }

    this.logger.log(
      // Formato, tamano y duracion. Nunca el texto: ver la cabecera.
      `transcrito ${sniffed.format} ${Math.round(file.buffer.length / 1024)}KB ` +
        `${result.durationSec}s -> ${result.detectedLanguage} (${result.confidence})`,
    );

    return result;
  }

  /**
   * Del error del proveedor al que ve el cliente.
   *
   * Cada categoria tiene un codigo estable y un estado distinto porque el
   * cliente hace cosas distintas: ante `QUOTA` invita a esperar, ante
   * `NOT_CONFIGURED` esconde el microfono, y ante `EMPTY_AUDIO` pide que se
   * repita. Un unico 500 para todo obligaria a adivinar leyendo el mensaje.
   */
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
        // 503 y no 500: el sitio funciona, esta pieza no. Y el mensaje no dice
        // que falte una clave -eso es informacion de dentro-, solo que no se
        // puede ahora.
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
