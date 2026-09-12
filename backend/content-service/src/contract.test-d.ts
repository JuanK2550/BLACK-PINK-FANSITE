// Comprueba en compilación que las respuestas cumplen el contrato de tipos.

import type {
  AlbumDetail,
  AlbumSummary,
  Award,
  MemberDetail,
  MemberSummary,
  QuizQuestion,
  SearchResult,
  SoloWork,
  SoloTrack,
  TimelineEvent,
  Track,
  Trivia,
} from '@blackpink/types';
import type { AlbumDetailDto, AlbumSummaryDto, TrackDto } from './albums/albums.dto';
import type { AwardDto, QuizQuestionDto, TimelineEventDto, TriviaDto } from './catalog/catalog.dto';
import type {
  MemberDetailDto,
  MemberSummaryDto,
  SoloTrackDto,
  SoloWorkDto,
} from './members/members.dto';
import type { SearchResultDto } from './search/search.dto';

declare const memberSummary: MemberSummaryDto;
declare const memberDetail: MemberDetailDto;
declare const soloWork: SoloWorkDto;
declare const soloTrack: SoloTrackDto;
declare const albumSummary: AlbumSummaryDto;
declare const albumDetail: AlbumDetailDto;
declare const track: TrackDto;
declare const timelineEvent: TimelineEventDto;
declare const trivia: TriviaDto;
declare const award: AwardDto;
declare const quizQuestion: QuizQuestionDto;
declare const searchResult: SearchResultDto;

export const contract = {
  memberSummary: memberSummary satisfies MemberSummary,
  memberDetail: memberDetail satisfies MemberDetail,
  soloWork: soloWork satisfies SoloWork,
  soloTrack: soloTrack satisfies SoloTrack,
  albumSummary: albumSummary satisfies AlbumSummary,
  albumDetail: albumDetail satisfies AlbumDetail,
  track: track satisfies Track,
  timelineEvent: timelineEvent satisfies TimelineEvent,
  trivia: trivia satisfies Trivia,
  award: award satisfies Award,
  quizQuestion: quizQuestion satisfies QuizQuestion,
  searchResult: searchResult satisfies SearchResult,
};
