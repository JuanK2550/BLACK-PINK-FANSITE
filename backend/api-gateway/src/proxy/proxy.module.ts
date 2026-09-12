// Módulo del proxy.

import { Module } from '@nestjs/common';
import { UpstreamService } from '../upstream/upstream.service';
import { ChatProxyController } from './chat-proxy.controller';
import { ProxyController } from './proxy.controller';
import { SpeechProxyController } from './speech-proxy.controller';

@Module({
  controllers: [ChatProxyController, SpeechProxyController, ProxyController],
  providers: [UpstreamService],
  exports: [UpstreamService],
})
export class ProxyModule {}
