// Registra los mensajes bloqueados sin guardar su texto.

import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { Locale } from '@blackpink/types';

export type BlockPhase = 'input' | 'output';

export interface BlockRecord {
  phase: BlockPhase;
  kind: string;
  rules: string[];
  locale: Locale;
  messageLength: number;
  sessionId: string;
  message: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('SafetyAudit');

  private readonly counters = new Map<string, number>();

  record(entry: BlockRecord): void {
    const key = `${entry.phase}:${entry.kind}`;
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);

    this.logger.warn({
      evento: 'bloqueo',
      fase: entry.phase,
      tipo: entry.kind,
      reglas: entry.rules,
      idioma: entry.locale,
      longitud: entry.messageLength,
      huellaMensaje: fingerprint(entry.message),
      huellaSesion: fingerprint(entry.sessionId),
    });
  }

  summary(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }
}

function fingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}
