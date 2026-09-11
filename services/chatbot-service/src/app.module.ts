import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { ProviderModule } from './provider/provider.module';
import { RagModule } from './rag/rag.module';
import { SafetyModule } from './safety/safety.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // .env unico en la raiz del monorepo. En Docker las variables llegan
      // desde docker-compose y este fichero simplemente no existe.
      envFilePath: ['../../.env', '.env'],
    }),
    SafetyModule,
    ProviderModule,
    RagModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}
