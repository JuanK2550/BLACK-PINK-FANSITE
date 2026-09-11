import { Module } from '@nestjs/common';
import { UpstreamService } from '../upstream/upstream.service';
import { ChatProxyController } from './chat-proxy.controller';
import { ProxyController } from './proxy.controller';
import { SpeechProxyController } from './speech-proxy.controller';

@Module({
  // Los especificos van PRIMERO: Nest resuelve por orden de declaracion y el
  // proxy general captura cualquier ruta con su comodin.
  controllers: [ChatProxyController, SpeechProxyController, ProxyController],
  providers: [UpstreamService],
  exports: [UpstreamService],
})
export class ProxyModule {}
