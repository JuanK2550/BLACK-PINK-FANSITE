// Módulo raíz del chatbot.

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { buildLoggerConfig } from '@blackpink/service-core';
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
      envFilePath: ['../../.env', '.env'],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildLoggerConfig({
          service: 'chatbot-service',
          level: config.get<string>('LOG_LEVEL'),
          pretty: config.get<string>('NODE_ENV') === 'development',
        }),
    }),
    SafetyModule,
    ProviderModule,
    RagModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}
