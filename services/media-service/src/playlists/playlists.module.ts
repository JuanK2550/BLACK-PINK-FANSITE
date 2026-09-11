import { Module } from '@nestjs/common';
import { ContentClientService } from '../content-client/content-client.service';
import { EmbedsService } from '../embeds/embeds.service';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';

@Module({
  controllers: [PlaylistsController],
  providers: [PlaylistsService, EmbedsService, ContentClientService],
  exports: [PlaylistsService, EmbedsService, ContentClientService],
})
export class PlaylistsModule {}
