import { Injectable, NotFoundException } from '@nestjs/common';
import type { Locale } from '@blackpink/types';
import { firstText, pickTranslation, toDatePrecision, toIsoDate } from '../common/localize';
import { PrismaService } from '../prisma/prisma.service';
import type {
  MemberDetailDto,
  MemberSummaryDto,
  MemberTimelineDto,
  MemberTriviaDto,
  SoloTrackDto,
  SoloWorkDto,
} from './members.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(locale: Locale, includeUnverified: boolean): Promise<MemberSummaryDto[]> {
    const visible = includeUnverified ? {} : { verified: true };

    const rows = await this.prisma.member.findMany({
      where: visible,
      orderBy: { displayOrder: 'asc' },
      include: { translations: true },
    });

    return rows.map((row) => this.toSummary(row, locale));
  }

  /**
   * Ficha completa: la integrante mas su trabajo en solitario, sus
   * curiosidades y su cronologia personal.
   *
   * Va en UNA consulta con `include` anidados en vez de cinco consultas
   * sueltas: son relaciones pequenas y acotadas, y cinco viajes a la base para
   * pintar una ficha es justo el problema N+1 que la gente descubre en
   * produccion.
   */
  async findBySlug(
    slug: string,
    locale: Locale,
    includeUnverified: boolean,
  ): Promise<MemberDetailDto> {
    const visible = includeUnverified ? {} : { verified: true };

    const row = await this.prisma.member.findUnique({
      where: { slug },
      include: {
        translations: true,
        soloWorks: {
          where: visible,
          orderBy: { releaseDate: 'desc' },
          include: {
            translations: true,
            // Las canciones siguen la misma regla que todo lo demas: lo que no
            // esta contrastado no se publica.
            tracks: { where: visible, orderBy: { trackNumber: 'asc' } },
          },
        },
        trivia: {
          where: visible,
          include: { translations: true },
        },
        timelineEvents: {
          where: visible,
          orderBy: { date: 'asc' },
          include: { translations: true },
        },
      },
    });

    /*
     * Un registro sin contrastar se trata como inexistente, no como oculto.
     * Devolver 403 o un cuerpo vacio confirmaria que el recurso existe, y el
     * sitio no publica lo que no ha verificado: para el publico, sencillamente
     * no esta.
     */
    if (!row || (!includeUnverified && !row.verified)) {
      // El mensaje nombra el recurso pedido, no la tabla ni la consulta.
      throw new NotFoundException(`No existe ninguna integrante con el identificador "${slug}".`);
    }

    const translation = pickTranslation(row.translations, locale);

    return {
      ...this.toSummary(row, locale),
      nickname: firstText(translation?.nickname),
      bio: firstText(translation?.bio, row.bio),
      description: firstText(translation?.description),
      socials: (row.socials as Record<string, string> | null) ?? null,
      soloWorks: row.soloWorks.map((work): SoloWorkDto => {
        const t = pickTranslation(work.translations, locale);
        return {
          slug: work.slug,
          title: firstText(t?.title, work.title) ?? work.title,
          type: work.type,
          releaseDate: toIsoDate(work.releaseDate) ?? '',
          formatLabel: firstText(t?.formatLabel),
          description: firstText(t?.description),
          coverUrl: work.coverUrl,
          coverWidth: work.coverWidth,
          coverHeight: work.coverHeight,
          coverThumbUrl: work.coverThumbUrl,
          coverThumbWidth: work.coverThumbWidth,
          coverThumbHeight: work.coverThumbHeight,
          durationSec: work.durationSec,
          spotifyId: work.spotifyId,
          verified: work.verified,
          tracks: work.tracks.map((track): SoloTrackDto => ({
            id: track.id,
            title: track.title,
            trackNumber: track.trackNumber,
            durationSec: track.durationSec,
            isTitleTrack: track.isTitleTrack,
            featuring: track.featuring,
            spotifyId: track.spotifyId,
            verified: track.verified,
          })),
        };
      }),
      trivia: row.trivia.map((item): MemberTriviaDto => {
        const t = pickTranslation(item.translations, locale);
        return {
          id: item.id,
          category: item.category,
          content: firstText(t?.content, item.content) ?? item.content,
          source: item.source,
          verified: item.verified,
        };
      }),
      timeline: row.timelineEvents.map((event): MemberTimelineDto => {
        const t = pickTranslation(event.translations, locale);
        return {
          id: event.id,
          date: toIsoDate(event.date) ?? '',
          datePrecision: toDatePrecision(event.datePrecision),
          title: firstText(t?.title, event.title) ?? event.title,
          description: firstText(t?.description, event.description),
          category: event.category,
          importance: event.importance,
          verified: event.verified,
        };
      }),
    };
  }

  private toSummary(
    row: {
      slug: string;
      stageName: string;
      fullName: string;
      koreanName: string | null;
      position: string;
      nationality: string;
      birthDate: Date | null;
      colorAccent: string | null;
      imageUrl: string | null;
      imageWidth: number | null;
      imageHeight: number | null;
      imageAuthor: string | null;
      imageLicense: string | null;
      imageLicenseUrl: string | null;
      imageSource: string | null;
      imageDate: Date | null;
      imageFocus: string | null;
      verified: boolean;
      translations: {
        locale: Locale;
        position: string | null;
        nationality: string | null;
        imageAlt: string | null;
      }[];
    },
    locale: Locale,
  ): MemberSummaryDto {
    const translation = pickTranslation(row.translations, locale);

    return {
      slug: row.slug,
      stageName: row.stageName,
      fullName: row.fullName,
      koreanName: row.koreanName,
      position: firstText(translation?.position, row.position) ?? row.position,
      // Igual que `position`: la traducida si existe, y si no la canonica.
      nationality: firstText(translation?.nationality, row.nationality) ?? row.nationality,
      birthDate: toIsoDate(row.birthDate),
      colorAccent: row.colorAccent,

      imageUrl: row.imageUrl,
      imageWidth: row.imageWidth,
      imageHeight: row.imageHeight,
      imageAuthor: row.imageAuthor,
      imageLicense: row.imageLicense,
      imageLicenseUrl: row.imageLicenseUrl,
      imageSource: row.imageSource,
      imageDate: toIsoDate(row.imageDate),
      imageFocus: row.imageFocus,
      // El alt cae al idioma pedido como el resto de las traducciones.
      imageAlt: translation?.imageAlt ?? null,

      verified: row.verified,
    };
  }
}
