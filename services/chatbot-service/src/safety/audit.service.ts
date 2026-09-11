import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { Locale } from '@blackpink/types';

/**
 * ============================================================================
 * AUDITORIA DE BLOQUEOS
 * ============================================================================
 * Registra QUE se bloqueo y POR QUE regla, nunca QUE ESCRIBIO NADIE.
 *
 * La tentacion evidente es guardar el mensaje: seria comodisimo para afinar
 * los patrones. Es justo lo que no se hace, y por una razon concreta: **el
 * mensaje es exactamente el sitio donde apareceria un dato personal**. Alguien
 * que pregunta por el telefono de una integrante puede haber escrito el suyo
 * de paso; alguien que cuenta un problema personal para justificar su peticion
 * lo deja escrito entero. Un log de seguridad que acumula eso se convierte en
 * el mayor riesgo de privacidad del servicio, que es lo contrario de su
 * proposito.
 *
 * Lo que si se guarda, y por que cada cosa:
 *
 *   regla y categoria  para saber que salto y poder afinarlo
 *   fase               entrada o salida: no es lo mismo que lo diga el
 *                      visitante que que lo diga el modelo
 *   idioma             para ver si un patron solo funciona en castellano
 *   longitud           una carga de inyeccion es larga; un insulto, corto
 *   huella del mensaje sha256 recortado: permite ver que es EL MISMO intento
 *                      repetido sin poder reconstruir el texto
 *   huella de sesion   permite ver insistencia sin identificar a nadie
 *
 * NO se guarda: el texto, la IP, el sessionId en claro ni cabecera alguna.
 *
 * Va al logger de la aplicacion (pino), asi que hereda la rotacion y el
 * destino que ya tiene el servicio. No se inventa un fichero aparte que nadie
 * vigilaria.
 * ============================================================================
 */

export type BlockPhase = 'input' | 'output';

export interface BlockRecord {
  phase: BlockPhase;
  /** `injection` o una categoria de moderacion. */
  kind: string;
  /** Reglas que dispararon. */
  rules: string[];
  locale: Locale;
  messageLength: number;
  sessionId: string;
  message: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('SafetyAudit');

  /** Contadores en memoria, para /chat/status. Se pierden al reiniciar, y esta bien. */
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
      // Huellas, no contenido. Doce caracteres bastan para agrupar
      // repeticiones y no permiten volver al texto original.
      huellaMensaje: fingerprint(entry.message),
      huellaSesion: fingerprint(entry.sessionId),
    });
  }

  /** Resumen para diagnostico. Sin nada que identifique a nadie. */
  summary(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }
}

function fingerprint(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}
