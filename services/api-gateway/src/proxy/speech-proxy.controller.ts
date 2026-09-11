import { Controller, Logger, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

/**
 * ============================================================================
 * PASO DE AUDIO HACIA speech-service
 * ============================================================================
 * El proxy general de este gateway tampoco sirve aqui, y por razones parecidas
 * a las del chat pero no identicas:
 *
 *   - Solo reenvia GET y HEAD. Esto es POST.
 *   - Cachea. Cachear un audio seria guardarlo, que es justo lo que este
 *     camino promete no hacer.
 *   - Y sobre todo: PARSEA EL CUERPO. El gateway tiene el parser de JSON
 *     puesto globalmente; un `multipart/form-data` con audio binario pasando
 *     por ahi se corrompe o se rechaza.
 *
 * POR ESO ESTE CONTROLADOR NO MIRA EL CUERPO. Canaliza los bytes crudos de la
 * peticion tal y como llegan -incluida la cabecera `content-type` con su
 * `boundary`, que sin ella el multipart es indescifrable- y deja que sea
 * speech-service quien lo interprete. El gateway no necesita entender el audio
 * para reenviarlo, y cuanto menos lo toque, menos puede estropearlo.
 *
 * EL AUDIO NO SE GUARDA EN NINGUN PUNTO DE ESTE CAMINO. Aqui pasa de un socket
 * a otro sin tocar el disco.
 *
 * Y SIGUE SIENDO LISTA BLANCA: una ruta, no un comodin hacia speech-service.
 * ============================================================================
 */
@ApiTags('speech')
@Controller()
export class SpeechProxyController {
  private readonly logger = new Logger(SpeechProxyController.name);
  private readonly baseUrl: string;

  /** Transcribir 60s de audio no deberia pasar de aqui. */
  private readonly timeoutMs = 60_000;

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('SPEECH_SERVICE_URL')?.trim() || 'http://localhost:4004'
    ).replace(/\/+$/, '');
  }

  @Post('transcribe')
  // Limite del gateway ademas del que aplica speech-service: este frena antes
  // de gastar un salto de red, el de alla protege aunque alguien alcance el
  // servicio sin pasar por aqui.
  @Throttle({ expensive: {} })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Reenvia un audio a speech-service. No lo lee, no lo cachea y no lo guarda.',
  })
  async transcribe(@Req() req: Request, @Res() res: Response): Promise<void> {
    const controller = new AbortController();

    /*
     * Se escucha el cierre de la RESPUESTA, no el de la peticion.
     *
     * `req.on('close')` parece lo natural y aqui es un error: en un cuerpo que
     * nadie ha parseado -este multipart- ese evento salta cuando termina de
     * LEERSE el cuerpo, que es justo mientras `fetch` lo esta reenviando. El
     * resultado es que la peticion se aborta a si misma y todo devuelve 503 en
     * ocho milisegundos. Medido.
     *
     * El cierre de la respuesta si significa lo que se quiere saber: que el
     * visitante se ha ido. Y se comprueba que no hayamos terminado nosotros,
     * porque tambien salta al acabar bien.
     */
    res.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });

    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const contentType = req.headers['content-type'];
      if (!contentType?.startsWith('multipart/form-data')) {
        res.status(415).json({
          data: null,
          meta: { timestamp: new Date().toISOString(), service: 'api-gateway' },
          error: {
            statusCode: 415,
            message: 'Se espera multipart/form-data con un campo `audio`.',
            code: 'UNSUPPORTED_MEDIA_TYPE',
          },
        });
        return;
      }

      const upstream = await fetch(`${this.baseUrl}/api/v1/transcribe`, {
        method: 'POST',
        headers: {
          // El `boundary` viaja dentro del content-type. Reconstruirlo o
          // normalizarlo romperia el multipart entero.
          'content-type': contentType,
          ...(req.headers['content-length']
            ? { 'content-length': String(req.headers['content-length']) }
            : {}),
        },
        // El cuerpo crudo, sin interpretar. `duplex` es obligatorio en
        // undici para enviar un stream como cuerpo.
        body: req as unknown as ReadableStream,
        duplex: 'half',
        signal: controller.signal,
      } as RequestInit & { duplex: 'half' });

      const payload = await upstream.text();

      res.status(upstream.status);
      res.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json');
      // Una transcripcion no se cachea jamas: es contenido de una persona.
      res.setHeader('cache-control', 'no-store');
      res.setHeader('x-gateway-upstream', 'speech');
      res.send(payload);
    } catch (error) {
      if (!controller.signal.aborted) {
        this.logger.warn(`speech-service no responde: ${String(error)}`);
      }

      if (!res.headersSent) {
        res.status(503).json({
          data: null,
          meta: { timestamp: new Date().toISOString(), service: 'api-gateway' },
          error: {
            statusCode: 503,
            message: 'El servicio de transcripcion no esta disponible.',
            code: 'ASR_UNAVAILABLE',
          },
        });
      }
    } finally {
      clearTimeout(timer);
      if (!res.writableEnded) res.end();
    }
  }
}
