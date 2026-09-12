// Límite de transcripciones por IP.

import { HttpException, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class SpeechThrottlerGuard extends ThrottlerGuard {
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
