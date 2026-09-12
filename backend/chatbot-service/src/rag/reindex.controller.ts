// Endpoint interno para rehacer el índice.

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

const HEADER = 'x-internal-key';

const LONGITUD_MINIMA = 24;

function iguales(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

@Controller('admin')
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
