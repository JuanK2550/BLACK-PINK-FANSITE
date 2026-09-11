import { HttpException, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * ============================================================================
 * LIMITE DE TRANSCRIPCIONES
 * ============================================================================
 * NO CONFUNDIR CON LA CUOTA DE GROQ. Son dos limites distintos y ninguno
 * sustituye al otro:
 *
 *   - Este de aqui protege AL SITIO de que una sola IP consuma la cuota
 *     compartida de todos los visitantes. Lo decidimos nosotros y el visitante
 *     ve un 429 con `SPEECH_RATE_LIMIT`.
 *   - La cuota del plan gratuito la decide Groq, es POR ORGANIZACION y no por
 *     clave -generar otra clave no da mas cuota-, y se agota aunque nadie
 *     abuse. Cuando salta, el visitante ve «vuelve en un rato» con
 *     `ASR_QUOTA`.
 *
 * Un visitante puede toparse con el primero portandose mal, y con el segundo
 * sin hacer nada raro. Por eso los mensajes y los codigos son distintos.
 *
 * 10 CADA 10 MINUTOS, mas estricto que cualquier otro limite del sitio, y por
 * dos razones: cada llamada cuesta cuota de verdad, y nadie dicta diez veces
 * en diez minutos de forma legitima. Quien lo necesite, tiene el teclado.
 * ============================================================================
 */
@Injectable()
export class SpeechThrottlerGuard extends ThrottlerGuard {
  /**
   * El 429 de aqui NO se puede confundir con el del proveedor: lleva su propio
   * codigo. Sin esto, el frontend recibiria dos 429 con significados opuestos
   * -«has pedido demasiado tu» y «se ha agotado para todos»- y tendria que
   * adivinar cual es leyendo el texto.
   */
  protected override throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        code: 'SPEECH_RATE_LIMIT',
        message: 'Has enviado demasiados audios seguidos. Espera unos minutos.',
      },
      429,
    );
  }
}
