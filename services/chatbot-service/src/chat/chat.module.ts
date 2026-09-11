import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { RagModule } from '../rag/rag.module';
import { ChatThrottlerGuard } from './chat-throttler.guard';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [
    RagModule,
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'short', ttl: 60_000, limit: 20 },
        // Un dia. Una "sesion" no tiene final propio, asi que se le pone uno
        // explicito en vez de fingir que el servidor sabe cuando termina.
        { name: 'session', ttl: 86_400_000, limit: 200 },
      ],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, { provide: APP_GUARD, useClass: ChatThrottlerGuard }],
  exports: [ChatService],
})
export class ChatModule {}
