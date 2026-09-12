// Comprueba en compilación que las respuestas cumplen el contrato de tipos.

import type { PlaylistDetail, PlaylistSummary, TrackEmbed } from '@blackpink/types';
import type { TrackEmbed as ServiceTrackEmbed } from './embeds/embed.builder';
import type { PlaylistDetailDto, PlaylistSummaryDto } from './playlists/playlists.service';

declare const playlistSummary: PlaylistSummaryDto;
declare const playlistDetail: PlaylistDetailDto;
declare const trackEmbed: ServiceTrackEmbed;

export const contract = {
  playlistSummary: playlistSummary satisfies PlaylistSummary,
  playlistDetail: playlistDetail satisfies PlaylistDetail,
  trackEmbed: trackEmbed satisfies TrackEmbed,
};
