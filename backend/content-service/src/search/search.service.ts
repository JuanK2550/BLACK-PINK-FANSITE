// Búsqueda en integrantes, discos, canciones y cronología.

import { Injectable } from '@nestjs/common';
import type { Locale } from '@blackpink/types';
import { firstText, pickTranslation, toIsoDate } from '../common/localize';
import { PrismaService } from '../prisma/prisma.service';
import type { SearchHitDto, SearchResultDto } from './search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    q: string,
    locale: Locale,
    limit: number,
    includeUnverified: boolean,
  ): Promise<SearchResultDto> {
    const term = q.trim();
    const contains = { contains: term, mode: 'insensitive' as const };

    const visible = includeUnverified ? {} : { verified: true };

    const [members, albums, tracks, timeline, soloWorks, soloTracks] = await Promise.all([
      this.prisma.member.findMany({
        where: {
          ...visible,
          OR: [
            { stageName: contains },
            { fullName: contains },
            { koreanName: contains },
            { translations: { some: { nickname: contains } } },
          ],
        },
        take: limit,
        orderBy: { displayOrder: 'asc' },
        include: { translations: true },
      }),

      this.prisma.album.findMany({
        where: {
          ...visible,
          OR: [{ title: contains }, { translations: { some: { title: contains } } }],
        },
        take: limit,
        orderBy: { releaseDate: 'desc' },
        include: { translations: true },
      }),

      this.prisma.track.findMany({
        where: {
          ...visible,
          ...(includeUnverified ? {} : { album: { verified: true } }),
          OR: [
            { title: contains },
            { titleLocalized: { path: ['ko'], string_contains: term } },
            { titleLocalized: { path: ['en'], string_contains: term } },
          ],
        },
        take: limit,
        orderBy: [{ isTitleTrack: 'desc' }, { trackNumber: 'asc' }],
        include: { album: { select: { slug: true, title: true, releaseDate: true } } },
      }),

      this.prisma.timelineEvent.findMany({
        where: {
          ...visible,
          OR: [{ title: contains }, { translations: { some: { title: contains } } }],
        },
        take: limit,
        orderBy: { date: 'desc' },
        include: { translations: true },
      }),

      this.prisma.soloWork.findMany({
        where: {
          ...visible,
          ...(includeUnverified ? {} : { member: { verified: true } }),
          OR: [{ title: contains }, { translations: { some: { title: contains } } }],
        },
        take: limit,
        orderBy: { releaseDate: 'desc' },
        include: {
          translations: true,
          member: { select: { slug: true, stageName: true } },
        },
      }),

      this.prisma.soloTrack.findMany({
        where: {
          ...visible,
          ...(includeUnverified
            ? {}
            : { soloWork: { verified: true, member: { verified: true } } }),
          title: contains,
        },
        take: limit,
        orderBy: [{ isTitleTrack: 'desc' }, { trackNumber: 'asc' }],
        include: {
          soloWork: {
            select: {
              title: true,
              releaseDate: true,
              member: { select: { slug: true, stageName: true } },
            },
          },
        },
      }),
    ]);

    const memberHits: SearchHitDto[] = members.map((row) => {
      const t = pickTranslation(row.translations, locale);
      return {
        type: 'member',
        id: row.slug,
        title: row.stageName,
        subtitle: firstText(t?.position, row.position),
        href: `/integrantes/${row.slug}`,
      };
    });

    const albumHits: SearchHitDto[] = albums.map((row) => {
      const t = pickTranslation(row.translations, locale);
      return {
        type: 'album',
        id: row.slug,
        title: firstText(t?.title, row.title) ?? row.title,
        subtitle: `${firstText(t?.formatLabel) ?? row.type} · ${row.releaseDate.getUTCFullYear()}`,
        href: `/discografia/${row.slug}`,
      };
    });

    const trackHits: SearchHitDto[] = tracks.map((row) => ({
      type: 'track',
      id: row.id,
      title: row.title,
      subtitle: `${row.album.title} · ${row.album.releaseDate.getUTCFullYear()}`,
      href: `/discografia/${row.album.slug}#pista-${row.trackNumber}`,
    }));

    const timelineHits: SearchHitDto[] = timeline.map((row) => {
      const t = pickTranslation(row.translations, locale);
      return {
        type: 'timeline',
        id: row.id,
        title: firstText(t?.title, row.title) ?? row.title,
        subtitle: toIsoDate(row.date),
        href: `/cronologia#${row.id}`,
      };
    });

    const soloWorkHits: SearchHitDto[] = soloWorks.map((row) => {
      const t = pickTranslation(row.translations, locale);
      return {
        type: 'album',
        id: row.slug,
        title: firstText(t?.title, row.title) ?? row.title,
        subtitle: `${row.member.stageName} · ${firstText(t?.formatLabel) ?? row.type} · ${row.releaseDate.getUTCFullYear()}`,
        href: `/integrantes/${row.member.slug}`,
      };
    });

    const soloTrackHits: SearchHitDto[] = soloTracks.map((row) => ({
      type: 'track',
      id: row.id,
      title: row.title,
      subtitle: `${row.soloWork.member.stageName} · ${row.soloWork.title} · ${row.soloWork.releaseDate.getUTCFullYear()}`,
      href: `/integrantes/${row.soloWork.member.slug}`,
    }));

    const allAlbums = [...albumHits, ...soloWorkHits].slice(0, limit);
    const allTracks = [...trackHits, ...soloTrackHits].slice(0, limit);

    return {
      query: term,
      total: memberHits.length + allAlbums.length + allTracks.length + timelineHits.length,
      members: memberHits,
      albums: allAlbums,
      tracks: allTracks,
      timeline: timelineHits,
    };
  }
}
