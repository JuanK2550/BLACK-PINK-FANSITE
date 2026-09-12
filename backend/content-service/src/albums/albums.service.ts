// Consulta de discos y canciones.

import { Injectable, NotFoundException } from '@nestjs/common';
import type { AlbumType, Locale, PageMeta } from '@blackpink/types';
import { buildPageMeta } from '@blackpink/service-core';
import { firstText, pickTranslation, toIsoDate } from '../common/localize';
import { PrismaService } from '../prisma/prisma.service';
import type { AlbumDetailDto, AlbumSummaryDto, AlbumsQueryDto, TrackDto } from './albums.dto';

const ORDER_BY = {
  releaseDate_desc: { releaseDate: 'desc' },
  releaseDate_asc: { releaseDate: 'asc' },
  title_asc: { title: 'asc' },
  title_desc: { title: 'desc' },
} as const;

@Injectable()
export class AlbumsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AlbumsQueryDto): Promise<{ items: AlbumSummaryDto[]; pagination: PageMeta }> {
    const where = {
      ...(query.type ? { type: query.type } : {}),
      ...query.verifiedFilter,
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.album.count({ where }),
      this.prisma.album.findMany({
        where,
        orderBy: ORDER_BY[query.sort],
        skip: query.skip,
        take: query.limit,
        include: {
          translations: true,
          _count: { select: { tracks: { where: query.verifiedFilter } } },
        },
      }),
    ]);

    return {
      items: rows.map((row) => this.toSummary(row, query.locale)),
      pagination: buildPageMeta(total, query.page, query.limit),
    };
  }

  async findBySlug(
    slug: string,
    locale: Locale,
    includeUnverified: boolean,
  ): Promise<AlbumDetailDto> {
    const row = await this.prisma.album.findUnique({
      where: { slug },
      include: {
        translations: true,
        _count: { select: { tracks: { where: includeUnverified ? {} : { verified: true } } } },
        tracks: {
          where: includeUnverified ? {} : { verified: true },
          orderBy: { trackNumber: 'asc' },
        },
      },
    });

    if (!row || (!includeUnverified && !row.verified)) {
      throw new NotFoundException(`No existe ningun album con el identificador "${slug}".`);
    }

    const translation = pickTranslation(row.translations, locale);

    return {
      ...this.toSummary(row, locale),
      description: firstText(translation?.description, row.description),
      spotifyId: row.spotifyId,
      tracks: row.tracks.map((track): TrackDto => {
        const localized = (track.titleLocalized as Record<string, string> | null) ?? null;
        return {
          id: track.id,
          title: track.title,
          trackNumber: track.trackNumber,
          durationSec: track.durationSec,
          isTitleTrack: track.isTitleTrack,
          localizedTitle: firstText(localized?.[locale]),
          spotifyId: track.spotifyId,
          lyricsAvailable: track.lyricsAvailable,
          verified: track.verified,
        };
      }),
    };
  }

  async findTrack(id: string, locale: Locale, includeUnverified: boolean) {
    const track = await this.prisma.track.findUnique({
      where: { id },
      include: {
        album: { select: { slug: true, title: true, releaseDate: true, verified: true } },
      },
    });

    if (!track || (!includeUnverified && (!track.verified || !track.album.verified))) {
      throw new NotFoundException(`No existe ninguna cancion con el identificador "${id}".`);
    }

    const localized = (track.titleLocalized as Record<string, string> | null) ?? null;

    return {
      id: track.id,
      title: track.title,
      localizedTitle: firstText(localized?.[locale]),
      trackNumber: track.trackNumber,
      durationSec: track.durationSec,
      isTitleTrack: track.isTitleTrack,
      spotifyId: track.spotifyId,
      lyricsAvailable: track.lyricsAvailable,
      verified: track.verified,
      album: {
        slug: track.album.slug,
        title: track.album.title,
        releaseDate: toIsoDate(track.album.releaseDate) ?? '',
      },
    };
  }

  private toSummary(
    row: {
      slug: string;
      title: string;
      type: AlbumType;
      releaseDate: Date;
      label: string | null;
      coverUrl: string | null;
      coverWidth: number | null;
      coverHeight: number | null;
      coverThumbUrl: string | null;
      coverThumbWidth: number | null;
      coverThumbHeight: number | null;
      verified: boolean;
      translations: { locale: Locale; title: string | null; formatLabel: string | null }[];
      _count: { tracks: number };
    },
    locale: Locale,
  ): AlbumSummaryDto {
    const translation = pickTranslation(row.translations, locale);

    return {
      slug: row.slug,
      title: firstText(translation?.title, row.title) ?? row.title,
      type: row.type,
      releaseDate: toIsoDate(row.releaseDate) ?? '',
      year: row.releaseDate.getUTCFullYear(),
      formatLabel: firstText(translation?.formatLabel),
      label: row.label,
      coverUrl: row.coverUrl,
      coverWidth: row.coverWidth,
      coverHeight: row.coverHeight,
      coverThumbUrl: row.coverThumbUrl,
      coverThumbWidth: row.coverThumbWidth,
      coverThumbHeight: row.coverThumbHeight,
      trackCount: row._count.tracks,
      verified: row.verified,
    };
  }
}
