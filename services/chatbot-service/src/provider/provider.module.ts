import { Global, Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai-provider';
import { GeminiProvider } from './gemini.provider';

/**
 * Un unico punto donde se elige el proveedor.
 *
 * Cambiar de Gemini a otro es sustituir esta clase por otra que implemente
 * `AiProvider`. Nada mas del servicio importa `GeminiProvider` directamente:
 * todo pide `AI_PROVIDER`.
 */
@Global()
@Module({
  providers: [GeminiProvider, { provide: AI_PROVIDER, useExisting: GeminiProvider }],
  exports: [AI_PROVIDER, GeminiProvider],
})
export class ProviderModule {}
