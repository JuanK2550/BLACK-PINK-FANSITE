// Límite de mensajes por IP.

import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

@Injectable()
export class ChatThrottlerGuard extends ThrottlerGuard {
  protected override generateKey(context: ExecutionContext, suffix: string, name: string): string {
    const base = super.generateKey(context, suffix, name);
    if (name !== 'session') return base;

    const request = context.switchToHttp().getRequest<Request>();
    const sessionId =
      typeof request.body === 'object' && request.body !== null && 'sessionId' in request.body
        ? String((request.body as { sessionId?: unknown }).sessionId ?? '')
        : '';

    return `${base}:${sessionId.slice(0, 64)}`;
  }
}
