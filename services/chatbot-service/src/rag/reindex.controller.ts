import { timingSafeEqual } from 'node:crypto';
import {
  ConflictException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { IndexerService } from './indexer.service';

/**
 * ============================================================================
 * REINDEXAR BAJO DEMANDA
 * ============================================================================
 * `POST /api/v1/admin/reindex` relanza el indexado sin reiniciar el servicio.
 * Lo llama el cron semanal `content-refresh.yml`: sin esto, el índice solo se
 * rehacía al arrancar, y un hito nuevo en la cronología no llegaba a PINKY
 * hasta el siguiente despliegue.
 *
 * NO PASA POR EL GATEWAY, y no debe: la lista blanca de
 * `api-gateway/src/proxy/routes.ts` no lo incluye. Es una operación interna.
 *
 * PROTEGIDO CON `INTERNAL_API_KEY` en la cabecera `x-internal-key`, comparada
 * en tiempo constante. Sin secreto configurado, o con uno equivocado, responde
 * **404** y no 401: un 401 confirmaría que el endpoint existe, que es la
 * misma razón por la que un registro sin contrastar responde 404 y no 403.
 *
 * RESPONDE 202 Y SIGUE EN SEGUNDO PLANO. Indexar son decenas de llamadas con
 * pausa a una API con cuota; tener la conexión HTTP abierta varios minutos es
 * pedir que un proxy intermedio la corte y deje el trabajo a medias sin que
 * nadie se entere. Si ya hay uno en marcha, 409: dos a la vez gastarían el
 * doble de cuota para escribir el mismo índice.
 * ============================================================================
 */

const HEADER = 'x-internal-key';

/** Un secreto más corto que esto es un marcador de posición, no un secreto. */
const LONGITUD_MINIMA = 24;

function iguales(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

@Controller('admin')
// El límite por IP es contra el abuso de visitantes; esto lo llama un cron
// autenticado y no debe competir con ellos por la misma cuota.
@SkipThrottle()
export class ReindexController {
  private readonly logger = new Logger(ReindexController.name);

  constructor(
    private readonly indexer: IndexerService,
    private readonly config: ConfigService,
  ) {}

  @Post('reindex')
  @HttpCode(202)
  reindex(@Headers(HEADER) provided: string | undefined): { status: 'accepted' } {
    const expected = this.config.get<string>('INTERNAL_API_KEY') ?? '';

    if (expected.length < LONGITUD_MINIMA || !provided || !iguales(provided, expected)) {
      throw new NotFoundException();
    }

    if (this.indexer.isRunning) {
      throw new ConflictException('Ya hay un indexado en curso.');
    }

    void this.indexer.reindexAll().catch((error: unknown) => {
      this.logger.error(`Reindexado bajo demanda fallido: ${String(error)}`);
    });

    return { status: 'accepted' };
  }
}
