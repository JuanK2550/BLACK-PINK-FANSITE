import { Injectable } from '@nestjs/common';
import type { Locale } from '@blackpink/types';
import { firstText, pickTranslation, toIsoDate } from '../common/localize';
import { PrismaService } from '../prisma/prisma.service';
import type { SearchHitDto, SearchResultDto } from './search.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busqueda global sobre integrantes, albumes, canciones y cronologia.
   *
   * Las cuatro consultas van EN PARALELO y cada una acotada por `limit`: son
   * independientes, y encadenarlas multiplicaria por cuatro la latencia de la
   * caja de busqueda, que es justo donde mas se nota.
   *
   * Se busca tanto en la columna canonica como en las traducciones, para que
   * escribir "뚜두뚜두" encuentre "DDU-DU DDU-DU" y "정규 앨범" encuentre los
   * albumes de estudio.
   */
  async search(
    q: string,
    locale: Locale,
    limit: number,
    includeUnverified: boolean,
  ): Promise<SearchResultDto> {
    const term = q.trim();
    const contains = { contains: term, mode: 'insensitive' as const };

    /*
     * El filtro se aplica a LOS CUATRO tipos.
     *
     * Antes la busqueda solo lo aplicaba a la cronologia, asi que un album sin
     * contrastar quedaba oculto en /albums pero aparecia al buscarlo: la puerta
     * de atras mas facil de dejar abierta, porque cada consulta se escribe por
     * separado y es la que se olvida.
     */
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
          // Y tampoco se cuela una cancion cuyo album no se publica.
          ...(includeUnverified ? {} : { album: { verified: true } }),
          OR: [
            { title: contains },
            /*
             * El titulo coreano vive en la columna JSON `titleLocalized`, no
             * en una tabla de traducciones. Sin este filtro, buscar "뚜두두"
             * no encontraria "DDU-DU DDU-DU" y la busqueda seria util solo
             * para quien ya sabe el titulo en alfabeto latino.
             */
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

      /*
       * LO EN SOLITARIO TAMBIEN SE BUSCA (Fase 14). Hasta aqui solo se
       * buscaban canciones de los discos del grupo, y «Handlebars», «CLICK» o
       * «Alter Ego» no devolvian nada aunque estuvieran en el sitio.
       *
       * Entran en las listas de discos y canciones que ya existen, sin tocar
       * el contrato: no tienen pagina propia, asi que llevan a la ficha de su
       * integrante. Y con la misma regla que el resto: ni una obra sin
       * contrastar, ni una cancion de una obra que no se publica.
       */
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

    // El grupo primero y lo en solitario detras, sin pasar del limite pedido.
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
