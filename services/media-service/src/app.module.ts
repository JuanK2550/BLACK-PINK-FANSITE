import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { CacheModule, buildLoggerConfig } from '@blackpink/service-core';
import { HealthModule } from './health/health.module';
import { PlaylistsModule } from './playlists/playlists.module';

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
          service: 'media-service',
          level: config.get<string>('LOG_LEVEL'),
          pretty: config.get<string>('NODE_ENV') === 'development',
        }),
    }),

    CacheModule.forRoot({
      namespace: 'media',
      url: process.env.REDIS_URL,
    }),

    PlaylistsModule,
    HealthModule,
  ],
})
export class AppModule {}
