import { Global, Module } from '@nestjs/common';
import { ASR_PROVIDER } from './asr-provider';
import { WhisperProvider } from './whisper.provider';

/**
 * Un unico punto donde se elige el proveedor.
 *
 * Hoy `WhisperProvider` cubre Groq y OpenAI porque los dos hablan el mismo
 * protocolo; `WHISPER_PROVIDER` decide cual. Un proveedor con otra API
 * -Deepgram, AssemblyAI- seria una clase nueva que implemente `AsrProvider` y
 * un cambio en esta lista. Nada mas del servicio importa `WhisperProvider`
 * directamente: todo pide `ASR_PROVIDER`.
 */
@Global()
@Module({
  providers: [WhisperProvider, { provide: ASR_PROVIDER, useExisting: WhisperProvider }],
  exports: [ASR_PROVIDER, WhisperProvider],
})
export class ProviderModule {}
