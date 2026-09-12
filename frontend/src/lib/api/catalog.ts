// Llamadas del catálogo: cronología, curiosidades, premios, quiz y buscador.

import type {
  Award,
  ContentParams,
  QuizQuestion,
  SearchResult,
  TimelineEvent,
  Trivia,
} from '@blackpink/types';
import { REVALIDATE, request, requestPage, type RequestOptions } from './client';

export interface TimelineParams extends ContentParams {
  category?: TimelineEvent['category'];
  from?: string;
  to?: string;
  memberSlug?: string;
}

export function getTimeline(params: TimelineParams = {}, options: RequestOptions = {}) {
  return requestPage<TimelineEvent>(
    '/content/timeline',
    {
      locale: params.locale,
      category: params.category,
      from: params.from,
      to: params.to,
      memberSlug: params.memberSlug,
      page: params.page,
      limit: params.limit,
    },
    { revalidate: REVALIDATE.catalog, tags: ['timeline'], ...options },
  );
}

export interface TriviaParams extends ContentParams {
  category?: Trivia['category'];
  memberSlug?: string;
  random?: boolean;
}

export function getTrivia(params: TriviaParams = {}, options: RequestOptions = {}) {
  return requestPage<Trivia>(
    '/content/trivia',
    {
      locale: params.locale,
      category: params.category,
      memberSlug: params.memberSlug,
      random: params.random,
      page: params.page,
      limit: params.limit,
    },
    {
      revalidate: params.random ? 0 : REVALIDATE.catalog,
      tags: ['trivia'],
      ...options,
    },
  );
}

export function getAwards(params: ContentParams = {}, options: RequestOptions = {}) {
  return requestPage<Award>(
    '/content/awards',
    { locale: params.locale, page: params.page, limit: params.limit },
    { revalidate: REVALIDATE.catalog, tags: ['awards'], ...options },
  );
}

export interface QuizParams extends ContentParams {
  difficulty?: QuizQuestion['difficulty'];
  random?: boolean;
  includeAnswers?: boolean;
}

export function getQuizQuestions(params: QuizParams = {}, options: RequestOptions = {}) {
  return requestPage<QuizQuestion>(
    '/content/quiz/questions',
    {
      locale: params.locale,
      difficulty: params.difficulty,
      random: params.random,
      includeAnswers: params.includeAnswers,
      limit: params.limit,
    },
    { revalidate: params.random ? 0 : REVALIDATE.catalog, tags: ['quiz'], ...options },
  );
}

export function search(query: string, params: ContentParams = {}, options: RequestOptions = {}) {
  return request<SearchResult>(
    '/content/search',
    { q: query, locale: params.locale, limit: params.limit },
    { revalidate: 0, ...options },
  ).then((result) => result.data);
}
