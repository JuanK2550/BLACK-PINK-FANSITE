// Elige el proveedor de transcripción.

import { Global, Module } from '@nestjs/common';
import { ASR_PROVIDER } from './asr-provider';
import { WhisperProvider } from './whisper.provider';

@Global()
@Module({
  providers: [WhisperProvider, { provide: ASR_PROVIDER, useExisting: WhisperProvider }],
  exports: [ASR_PROVIDER, WhisperProvider],
})
export class ProviderModule {}
