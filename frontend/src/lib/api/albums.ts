// Llamadas de discos.

import type { AlbumDetail, AlbumSummary, AlbumType, ContentParams } from '@blackpink/types';
import { REVALIDATE, request, requestPage, type RequestOptions } from './client';

export interface AlbumsParams extends ContentParams {
  type?: AlbumType;
  sort?: 'releaseDate_desc' | 'releaseDate_asc' | 'title_asc' | 'title_desc';
}

export function getAlbums(params: AlbumsParams = {}, options: RequestOptions = {}) {
  return requestPage<AlbumSummary>(
    '/content/albums',
    {
      locale: params.locale,
      type: params.type,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    },
    { revalidate: REVALIDATE.content, tags: ['albums'], ...options },
  );
}

export function getAlbum(slug: string, params: ContentParams = {}, options: RequestOptions = {}) {
  return request<AlbumDetail>(
    `/content/albums/${encodeURIComponent(slug)}`,
    { locale: params.locale },
    { revalidate: REVALIDATE.content, tags: ['albums', `album:${slug}`], ...options },
  ).then((result) => result.data);
}
