// Módulo raíz del servicio de contenido.

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule, buildLoggerConfig } from '@blackpink/service-core';
import { AlbumsModule } from './albums/albums.module';
import { CatalogModule } from './catalog/catalog.module';
import { HealthModule } from './health/health.module';
import { MembersModule } from './members/members.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';

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
          service: 'content-service',
          level: config.get<string>('LOG_LEVEL'),
          pretty: config.get<string>('NODE_ENV') === 'development',
        }),
    }),

    CacheModule.forRoot({
      namespace: 'content',
      url: process.env.REDIS_URL,
    }),

    PrismaModule,
    HealthModule,
    MembersModule,
    AlbumsModule,
    CatalogModule,
    SearchModule,
  ],
})
export class AppModule {}
