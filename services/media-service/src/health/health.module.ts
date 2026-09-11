import { Module } from '@nestjs/common';
import { PlaylistsModule } from '../playlists/playlists.module';
import { HealthController } from './health.controller';

@Module({ imports: [PlaylistsModule], controllers: [HealthController] })
export class HealthModule {}
