/**
 * ============================================================================
 * COMPROBACION DEL CONTRATO
 * ============================================================================
 * No ejecuta nada: existe para que el COMPILADOR falle si un DTO de este
 * servicio deja de encajar con el tipo publicado en @blackpink/types.
 *
 * Es la garantia que sustituye a "derivar los tipos de Prisma": el frontend
 * programa contra @blackpink/types, y si alguien anade, quita o cambia el tipo
 * de un campo en un DTO sin actualizar el contrato, `pnpm typecheck` lo para
 * aqui en vez de romperse en tiempo de ejecucion.
 *
 * `satisfies` comprueba la compatibilidad estructural en las dos direcciones
 * relevantes sin generar codigo.
 * ============================================================================
 */
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

/** Cada DTO debe poder usarse donde se espera el tipo publico. */
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
  /*
   * SoloWork se comprueba aparte aunque viaje dentro de MemberDetail: el
   * `satisfies` de arriba no hace comprobacion de propiedades sobrantes en un
   * tipo anidado, asi que un campo de mas en SoloWorkDto pasaria inadvertido.
   */
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
