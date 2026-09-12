// Arma cada playlist con las canciones de content-service.

import { Injectable, NotFoundException } from '@nestjs/common';
import type { Locale } from '@blackpink/types';
import {
  ContentClientService,
  type UpstreamAlbum,
  type UpstreamMember,
} from '../content-client/content-client.service';
import {
  PLAYLISTS,
  findPlaylist,
  type PlaylistBasis,
  type PlaylistDefinition,
} from '../data/playlists';
import { NO_EMBED_NOTE, buildSpotifyEmbed, type EmbedTarget } from '../embeds/embed.builder';

export interface PlaylistEntryDto {
  position: number;
  title: string;
  subtitle: string | null;
  durationSec: number | null;
  spotify: EmbedTarget | null;
  playable: boolean;
}

export interface PlaylistSummaryDto {
  slug: string;
  title: string;
  description: string;
  trackCount: number;
  basis: PlaylistBasis;
}

type ResolvedEntry = PlaylistEntryDto & { resolved: boolean };

export interface PlaylistDetailDto extends PlaylistSummaryDto {
  entries: PlaylistEntryDto[];
  playableCount: number;
  note: string | null;
}

@Injectable()
export class PlaylistsService {
  constructor(private readonly content: ContentClientService) {}

  list(locale: Locale): PlaylistSummaryDto[] {
    return [...PLAYLISTS]
      .sort((a, b) => a.order - b.order)
      .map((playlist) => this.toSummary(playlist, locale));
  }

  async findBySlug(slug: string, locale: Locale): Promise<PlaylistDetailDto> {
    const playlist = findPlaylist(slug);
    if (!playlist) {
      throw new NotFoundException(`No existe ninguna playlist con el identificador "${slug}".`);
    }

    const albumSlugs = new Set<string>();
    const memberSlugs = new Set<string>();
    for (const item of playlist.items) {
      if (item.kind === 'track') albumSlugs.add(item.albumSlug);
      else memberSlugs.add(item.memberSlug);
    }

    const [albums, members] = await Promise.all([
      Promise.all([...albumSlugs].map((s) => this.content.getAlbum(s, locale))),
      Promise.all([...memberSlugs].map((s) => this.content.getMember(s, locale))),
    ]);

    const albumsBySlug = new Map(albums.map((album) => [album.slug, album]));
    const membersBySlug = new Map(members.map((member) => [member.slug, member]));

    const resolved = playlist.items.map((item, index) =>
      item.kind === 'track'
        ? this.trackEntry(index, item.albumSlug, item.trackNumber, albumsBySlug)
        : this.soloEntry(index, item.memberSlug, item.soloWorkSlug, membersBySlug),
    );

    const entries = resolved
      .filter((entry) => entry.resolved)
      .map(({ resolved: _resolved, ...entry }, index) => ({ ...entry, position: index + 1 }));

    const playableCount = entries.filter((entry) => entry.playable).length;

    return {
      ...this.toSummary(playlist, locale),
      trackCount: entries.length,
      entries,
      playableCount,
      note: playableCount === 0 ? NO_EMBED_NOTE : null,
    };
  }

  private toSummary(playlist: PlaylistDefinition, locale: Locale): PlaylistSummaryDto {
    return {
      slug: playlist.slug,
      title: playlist.title[locale],
      description: playlist.description[locale],
      trackCount: playlist.items.length,
      basis: playlist.basis,
    };
  }

  private trackEntry(
    index: number,
    albumSlug: string,
    trackNumber: number,
    albums: Map<string, UpstreamAlbum>,
  ): ResolvedEntry {
    const album = albums.get(albumSlug);
    const track = album?.tracks.find((row) => row.trackNumber === trackNumber);

    if (!album || !track) {
      return {
        position: index + 1,
        title: `${albumSlug} #${trackNumber}`,
        subtitle: null,
        durationSec: null,
        spotify: null,
        playable: false,
        resolved: false,
      };
    }

    const spotify = buildSpotifyEmbed(track.spotifyId);

    return {
      position: index + 1,
      title: track.localizedTitle ?? track.title,
      subtitle: `${album.title} · ${album.year}`,
      durationSec: track.durationSec,
      spotify,
      playable: spotify !== null,
      resolved: true,
    };
  }

  private soloEntry(
    index: number,
    memberSlug: string,
    soloWorkSlug: string,
    members: Map<string, UpstreamMember>,
  ): ResolvedEntry {
    const member = members.get(memberSlug);
    const work = member?.soloWorks.find((row) => row.slug === soloWorkSlug);

    if (!member || !work) {
      return {
        position: index + 1,
        title: soloWorkSlug,
        subtitle: null,
        durationSec: null,
        spotify: null,
        playable: false,
        resolved: false,
      };
    }

    const spotify = buildSpotifyEmbed(work.spotifyId);

    return {
      position: index + 1,
      title: work.title,
      subtitle: `${member.stageName} · ${work.releaseDate.slice(0, 4)}`,
      durationSec: work.durationSec,
      spotify,
      playable: spotify !== null,
      resolved: true,
    };
  }
}
