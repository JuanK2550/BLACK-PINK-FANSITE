// Llamadas de medios: playlists y reproductores.

import type { ContentParams, PlaylistDetail, PlaylistSummary, TrackEmbed } from '@blackpink/types';
import { REVALIDATE, request, type RequestOptions } from './client';

export function getPlaylists(params: ContentParams = {}, options: RequestOptions = {}) {
  return request<PlaylistSummary[]>(
    '/media/playlists',
    { locale: params.locale },
    { revalidate: REVALIDATE.media, tags: ['playlists'], ...options },
  ).then((result) => result.data);
}

export function getPlaylist(
  slug: string,
  params: ContentParams = {},
  options: RequestOptions = {},
) {
  return request<PlaylistDetail>(
    `/media/playlists/${encodeURIComponent(slug)}`,
    { locale: params.locale },
    { revalidate: REVALIDATE.media, tags: ['playlists', `playlist:${slug}`], ...options },
  ).then((result) => result.data);
}

export function getTrackEmbed(
  id: string,
  params: ContentParams = {},
  options: RequestOptions = {},
) {
  return request<TrackEmbed>(
    `/media/tracks/${encodeURIComponent(id)}/embed`,
    { locale: params.locale },
    { revalidate: REVALIDATE.media, tags: [`embed:${id}`], ...options },
  ).then((result) => result.data);
}
