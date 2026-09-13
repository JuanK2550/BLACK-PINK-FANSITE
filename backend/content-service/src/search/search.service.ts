// Búsqueda en integrantes, discos, canciones y cronología, sin distinguir tildes ni mayúsculas.

import { Injectable } from '@nestjs/common';
import type { Locale } from '@blackpink/types';
import { firstText, pickTranslation, toIsoDate } from '../common/localize';
import { PrismaService } from '../prisma/prisma.service';
import type { SearchHitDto, SearchResultDto } from './search.dto';
import { foldColumn, likePattern } from './search-terms';

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
    const pattern = likePattern(term);
    const table = (name: string) => `"${this.prisma.schema}"."${name}"`;
    const matches = (...columns: string[]) =>
      columns.map((column) => `${foldColumn(column)} LIKE $1`).join(' OR ');

    // Prisma solo compara con mayúsculas y minúsculas: la comparación sin tildes va en SQL y
    // devuelve ids; los filtros, el orden y las relaciones siguen en Prisma.
    const [memberIds, albumIds, trackIds, timelineIds, soloWorkIds, soloTrackIds] =
      await Promise.all([
        this.ids(
          `SELECT m."id" FROM ${table('members')} m
           LEFT JOIN ${table('member_translations')} t ON t."memberId" = m."id"
           WHERE ${matches('m."stageName"', 'm."fullName"', 'm."koreanName"', 't."nickname"')}`,
          pattern,
        ),
        this.ids(
          `SELECT a."id" FROM ${table('albums')} a
           LEFT JOIN ${table('album_translations')} t ON t."albumId" = a."id"
           WHERE ${matches('a."title"', 't."title"')}`,
          pattern,
        ),
        this.ids(
          `SELECT "id" FROM ${table('tracks')}
           WHERE ${matches('"title"', `"titleLocalized"->>'ko'`, `"titleLocalized"->>'en'`)}`,
          pattern,
        ),
        this.ids(
          `SELECT e."id" FROM ${table('timeline_events')} e
           LEFT JOIN ${table('timeline_event_translations')} t ON t."eventId" = e."id"
           WHERE ${matches('e."title"', 't."title"')}`,
          pattern,
        ),
        this.ids(
          `SELECT w."id" FROM ${table('solo_works')} w
           LEFT JOIN ${table('solo_work_translations')} t ON t."soloWorkId" = w."id"
           WHERE ${matches('w."title"', 't."title"')}`,
          pattern,
        ),
        this.ids(`SELECT "id" FROM ${table('solo_tracks')} WHERE ${matches('"title"')}`, pattern),
      ]);

    const visible = includeUnverified ? {} : { verified: true };

    const [members, albums, tracks, timeline, soloWorks, soloTracks] = await Promise.all([
      this.prisma.member.findMany({
        where: { ...visible, id: { in: memberIds } },
        take: limit,
        orderBy: { displayOrder: 'asc' },
        include: { translations: true },
      }),

      this.prisma.album.findMany({
        where: { ...visible, id: { in: albumIds } },
        take: limit,
        orderBy: { releaseDate: 'desc' },
        include: { translations: true },
      }),

      this.prisma.track.findMany({
        where: {
          ...visible,
          ...(includeUnverified ? {} : { album: { verified: true } }),
          id: { in: trackIds },
        },
        take: limit,
        orderBy: [{ isTitleTrack: 'desc' }, { trackNumber: 'asc' }],
        include: { album: { select: { slug: true, title: true, releaseDate: true } } },
      }),

      this.prisma.timelineEvent.findMany({
        where: { ...visible, id: { in: timelineIds } },
        take: limit,
        orderBy: { date: 'desc' },
        include: { translations: true },
      }),

      this.prisma.soloWork.findMany({
        where: {
          ...visible,
          ...(includeUnverified ? {} : { member: { verified: true } }),
          id: { in: soloWorkIds },
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
          id: { in: soloTrackIds },
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

  private async ids(sql: string, pattern: string): Promise<string[]> {
    const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(sql, pattern);
    return rows.map((row) => row.id);
  }
}
