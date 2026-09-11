import { Injectable } from '@nestjs/common';
import type { Locale } from '@blackpink/types';
import { ContentClientService } from '../content-client/content-client.service';
import { NO_EMBED_NOTE, buildSpotifyEmbed, type TrackEmbed } from './embed.builder';

@Injectable()
export class EmbedsService {
  constructor(private readonly content: ContentClientService) {}

  /**
   * Datos de embed de una cancion.
   *
   * Cuando no hay identificador oficial devuelve `available: false` con una
   * nota, en lugar de inventarse una URL o de fabricar un enlace de busqueda.
   * Un embed que apunta al sitio equivocado es peor que la ausencia de embed:
   * el primero enganna al visitante y el segundo solo le informa.
   */
  async forTrack(id: string, locale: Locale): Promise<TrackEmbed> {
    const track = await this.content.getTrack(id, locale);

    const spotify = buildSpotifyEmbed(track.spotifyId);
    const available = spotify !== null;

    return {
      trackId: track.id,
      title: track.localizedTitle ?? track.title,
      album: {
        slug: track.album.slug,
        title: track.album.title,
        year: Number(track.album.releaseDate.slice(0, 4)),
      },
      spotify,
      available,
      note: available ? null : NO_EMBED_NOTE,
    };
  }
}
