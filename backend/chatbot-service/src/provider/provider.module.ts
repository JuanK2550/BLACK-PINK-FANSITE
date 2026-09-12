// Elige el proveedor de IA.

import { Global, Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai-provider';
import { GeminiProvider } from './gemini.provider';

@Global()
@Module({
  providers: [GeminiProvider, { provide: AI_PROVIDER, useExisting: GeminiProvider }],
  exports: [AI_PROVIDER, GeminiProvider],
})
export class ProviderModule {}
