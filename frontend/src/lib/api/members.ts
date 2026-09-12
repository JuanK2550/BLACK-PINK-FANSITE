// Llamadas de integrantes.

import type { ContentParams, MemberDetail, MemberSummary } from '@blackpink/types';
import { REVALIDATE, request, type RequestOptions } from './client';

export function getMembers(params: ContentParams = {}, options: RequestOptions = {}) {
  return request<MemberSummary[]>(
    '/content/members',
    { locale: params.locale },
    { revalidate: REVALIDATE.content, tags: ['members'], ...options },
  ).then((result) => result.data);
}

export function getMember(slug: string, params: ContentParams = {}, options: RequestOptions = {}) {
  return request<MemberDetail>(
    `/content/members/${encodeURIComponent(slug)}`,
    { locale: params.locale },
    { revalidate: REVALIDATE.content, tags: ['members', `member:${slug}`], ...options },
  ).then((result) => result.data);
}
