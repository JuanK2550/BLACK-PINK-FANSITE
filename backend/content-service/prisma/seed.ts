// Carga el contenido del sitio en la base de datos.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { parseConnection } from '../src/prisma/connection';
import { Locale, PrismaClient } from './generated/client';
import { ALBUMS } from './seed-data/albums';
import { AWARDS } from './seed-data/awards';
import { MEMBERS } from './seed-data/members';
import { QUIZ } from './seed-data/quiz';
import { SOLO_WORKS } from './seed-data/solo-works';
import { TIMELINE } from './seed-data/timeline';
import { TRIVIA } from './seed-data/trivia';

const rootEnv = path.resolve(import.meta.dirname, '../../../.env');
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

const { connectionString, schema } = parseConnection(process.env.DATABASE_URL_CONTENT);

const prisma = new PrismaClient({
  // PrismaPg no lee el ?schema= de la URL: hay que pasarlo aparte.
  adapter: new PrismaPg({ connectionString }, { schema }),
});

const LOCALES: Locale[] = [Locale.es, Locale.en, Locale.ko];

function stableId(...parts: string[]): string {
  // El separador es NUL: cambiarlo cambiaría todos los ids y duplicaría el catálogo.
  return createHash('sha256').update(parts.join('\u0000')).digest('hex').slice(0, 25);
}

function validate(): void {
  const problems: string[] = [];

  const memberSlugs = new Set(MEMBERS.map((m) => m.slug));

  for (const work of SOLO_WORKS) {
    if (!memberSlugs.has(work.memberSlug)) {
      problems.push(
        `SoloWork "${work.slug}" apunta a una integrante inexistente: ${work.memberSlug}`,
      );
    }
  }

  for (const event of TIMELINE) {
    if (event.memberSlug && !memberSlugs.has(event.memberSlug)) {
      problems.push(
        `Hito "${event.title.es}" apunta a una integrante inexistente: ${event.memberSlug}`,
      );
    }
    if (event.importance < 1 || event.importance > 5) {
      problems.push(`Hito "${event.title.es}" tiene importance fuera de 1..5: ${event.importance}`);
    }
  }

  for (const item of TRIVIA) {
    if (item.memberSlug && !memberSlugs.has(item.memberSlug)) {
      problems.push(`Curiosidad "${item.content.es}" apunta a una integrante inexistente.`);
    }
    if (item.source.trim().length === 0) {
      problems.push(`Curiosidad sin fuente: "${item.content.es}"`);
    }
  }

  for (const album of ALBUMS) {
    const numbers = album.tracks.map((t) => t.trackNumber);
    if (new Set(numbers).size !== numbers.length) {
      problems.push(`El album "${album.slug}" repite numeros de pista.`);
    }
  }

  for (const work of SOLO_WORKS) {
    const numbers = (work.tracks ?? []).map((t) => t.trackNumber);
    if (new Set(numbers).size !== numbers.length) {
      problems.push(`La obra "${work.slug}" repite numeros de pista.`);
    }
  }

  QUIZ.forEach((question, index) => {
    for (const locale of LOCALES) {
      const options = question.options[locale];
      if (options.length !== question.options.es.length) {
        problems.push(
          `Pregunta ${index + 1}: el idioma ${locale} tiene ${options.length} opciones y el espanol ${question.options.es.length}. correctIndex se comparte entre idiomas, asi que deben coincidir.`,
        );
      }
    }
    if (question.correctIndex < 0 || question.correctIndex >= question.options.es.length) {
      problems.push(
        `Pregunta ${index + 1}: correctIndex ${question.correctIndex} esta fuera del rango de opciones.`,
      );
    }
  });

  if (problems.length > 0) {
    throw new Error(
      `El seed no se ha ejecutado. Problemas encontrados:\n - ${problems.join('\n - ')}`,
    );
  }
}

async function seedMembers(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const member of MEMBERS) {
    const row = await prisma.member.upsert({
      where: { slug: member.slug },
      create: {
        slug: member.slug,
        stageName: member.stageName,
        fullName: member.fullName,
        koreanName: member.koreanName,
        birthDate: member.birthDate,
        nationality: member.nationality,
        position: member.position,
        bio: member.translations.bio.es,
        colorAccent: member.colorAccent,
        socials: member.socials,
        displayOrder: member.displayOrder,
        verified: member.verified,
        source: member.source,
        imageUrl: member.image?.url ?? null,
        imageWidth: member.image?.width ?? null,
        imageHeight: member.image?.height ?? null,
        imageAuthor: member.image?.author ?? null,
        imageLicense: member.image?.license ?? null,
        imageLicenseUrl: member.image?.licenseUrl ?? null,
        imageSource: member.image?.source ?? null,
        imageDate: member.image?.date ?? null,
        imageFocus: member.image?.focus ?? null,
      },
      update: {
        stageName: member.stageName,
        fullName: member.fullName,
        koreanName: member.koreanName,
        birthDate: member.birthDate,
        nationality: member.nationality,
        position: member.position,
        bio: member.translations.bio.es,
        colorAccent: member.colorAccent,
        socials: member.socials,
        displayOrder: member.displayOrder,
        verified: member.verified,
        source: member.source,
        imageUrl: member.image?.url ?? null,
        imageWidth: member.image?.width ?? null,
        imageHeight: member.image?.height ?? null,
        imageAuthor: member.image?.author ?? null,
        imageLicense: member.image?.license ?? null,
        imageLicenseUrl: member.image?.licenseUrl ?? null,
        imageSource: member.image?.source ?? null,
        imageDate: member.image?.date ?? null,
        imageFocus: member.image?.focus ?? null,
      },
    });
    ids.set(member.slug, row.id);

    for (const locale of LOCALES) {
      const payload = {
        position: member.translations.position[locale],
        nationality: member.translations.nationality[locale],
        nickname: member.translations.nickname[locale],
        bio: member.translations.bio[locale],
        description: member.translations.description[locale],
        imageAlt: member.image?.alt[locale] ?? null,
      };
      await prisma.memberTranslation.upsert({
        where: { memberId_locale: { memberId: row.id, locale } },
        create: { memberId: row.id, locale, ...payload },
        update: payload,
      });
    }
  }

  return ids;
}

async function seedAlbums(): Promise<void> {
  for (const album of ALBUMS) {
    const row = await prisma.album.upsert({
      where: { slug: album.slug },
      create: {
        slug: album.slug,
        title: album.title,
        type: album.type,
        releaseDate: album.releaseDate,
        label: album.label,
        description: album.translations.description.es,
        verified: album.verified,
        source: album.source,
      },
      update: {
        title: album.title,
        type: album.type,
        releaseDate: album.releaseDate,
        label: album.label,
        description: album.translations.description.es,
        verified: album.verified,
        source: album.source,
      },
    });

    for (const locale of LOCALES) {
      const payload = {
        formatLabel: album.translations.formatLabel[locale],
        description: album.translations.description[locale],
      };
      await prisma.albumTranslation.upsert({
        where: { albumId_locale: { albumId: row.id, locale } },
        create: { albumId: row.id, locale, ...payload },
        update: payload,
      });
    }

    for (const track of album.tracks) {
      const payload = {
        title: track.title,
        isTitleTrack: track.isTitleTrack ?? false,
        titleLocalized: track.titleLocalized ?? undefined,
        verified: track.verified,
        source: album.source,
      };
      await prisma.track.upsert({
        where: { albumId_trackNumber: { albumId: row.id, trackNumber: track.trackNumber } },
        create: { albumId: row.id, trackNumber: track.trackNumber, ...payload },
        update: payload,
      });
    }
  }
}

async function seedSoloWorks(memberIds: Map<string, string>): Promise<void> {
  for (const work of SOLO_WORKS) {
    const memberId = memberIds.get(work.memberSlug)!;
    const row = await prisma.soloWork.upsert({
      where: { slug: work.slug },
      create: {
        slug: work.slug,
        memberId,
        title: work.title,
        type: work.type,
        releaseDate: work.releaseDate,
        verified: work.verified,
        source: work.source,
      },
      update: {
        memberId,
        title: work.title,
        type: work.type,
        releaseDate: work.releaseDate,
        verified: work.verified,
        source: work.source,
      },
    });

    for (const locale of LOCALES) {
      const payload = {
        formatLabel: work.translations.formatLabel[locale],
        description: work.translations.description[locale],
      };
      await prisma.soloWorkTranslation.upsert({
        where: { soloWorkId_locale: { soloWorkId: row.id, locale } },
        create: { soloWorkId: row.id, locale, ...payload },
        update: payload,
      });
    }

    for (const track of work.tracks ?? []) {
      const payload = {
        title: track.title,
        isTitleTrack: track.isTitleTrack ?? false,
        featuring: track.featuring ?? null,
        verified: track.verified,
        source: work.source,
      };
      await prisma.soloTrack.upsert({
        where: { soloWorkId_trackNumber: { soloWorkId: row.id, trackNumber: track.trackNumber } },
        create: { soloWorkId: row.id, trackNumber: track.trackNumber, ...payload },
        update: payload,
      });
    }
  }
}

async function seedTimeline(memberIds: Map<string, string>): Promise<void> {
  for (const event of TIMELINE) {
    const id = stableId('timeline', event.date.toISOString().slice(0, 10), event.title.es);
    const memberId = event.memberSlug ? memberIds.get(event.memberSlug)! : null;

    const payload = {
      date: event.date,
      title: event.title.es,
      description: event.description.es,
      category: event.category,
      importance: event.importance,
      datePrecision: event.datePrecision,
      memberId,
      verified: event.verified,
      source: event.source,
    };

    await prisma.timelineEvent.upsert({
      where: { id },
      create: { id, ...payload },
      update: payload,
    });

    for (const locale of LOCALES) {
      const translation = {
        title: event.title[locale],
        description: event.description[locale],
      };
      await prisma.timelineEventTranslation.upsert({
        where: { eventId_locale: { eventId: id, locale } },
        create: { eventId: id, locale, ...translation },
        update: translation,
      });
    }
  }
}

async function seedTrivia(memberIds: Map<string, string>): Promise<void> {
  for (const item of TRIVIA) {
    const id = stableId('trivia', item.content.es);
    const memberId = item.memberSlug ? memberIds.get(item.memberSlug)! : null;

    const payload = {
      category: item.category,
      content: item.content.es,
      source: item.source,
      memberId,
      verified: item.verified,
    };

    await prisma.trivia.upsert({
      where: { id },
      create: { id, ...payload },
      update: payload,
    });

    for (const locale of LOCALES) {
      await prisma.triviaTranslation.upsert({
        where: { triviaId_locale: { triviaId: id, locale } },
        create: { triviaId: id, locale, content: item.content[locale] },
        update: { content: item.content[locale] },
      });
    }
  }
}

async function seedAwards(): Promise<void> {
  for (const award of AWARDS) {
    const row = await prisma.award.upsert({
      where: {
        organization_year_category_name: {
          organization: award.organization,
          year: award.year,
          category: award.category,
          name: award.name,
        },
      },
      create: {
        name: award.name,
        category: award.category,
        year: award.year,
        organization: award.organization,
        work: award.work,
        won: award.won,
        verified: award.verified,
        source: award.source,
      },
      update: {
        work: award.work,
        won: award.won,
        verified: award.verified,
        source: award.source,
      },
    });

    for (const locale of LOCALES) {
      const payload = {
        name: award.translations.name?.[locale] ?? null,
        category: award.translations.category[locale],
      };
      await prisma.awardTranslation.upsert({
        where: { awardId_locale: { awardId: row.id, locale } },
        create: { awardId: row.id, locale, ...payload },
        update: payload,
      });
    }
  }
}

async function seedQuiz(): Promise<void> {
  for (const item of QUIZ) {
    const id = stableId('quiz', item.question.es);

    const payload = {
      question: item.question.es,
      options: item.options.es,
      correctIndex: item.correctIndex,
      difficulty: item.difficulty,
      explanation: item.explanation.es,
      source: item.source,
      verified: item.verified,
    };

    await prisma.quizQuestion.upsert({
      where: { id },
      create: { id, ...payload },
      update: payload,
    });

    for (const locale of LOCALES) {
      const translation = {
        question: item.question[locale],
        options: item.options[locale],
        explanation: item.explanation[locale],
      };
      await prisma.quizQuestionTranslation.upsert({
        where: { questionId_locale: { questionId: id, locale } },
        create: { questionId: id, locale, ...translation },
        update: translation,
      });
    }
  }
}

interface ResolvedId {
  spotifyId: string;
  durationSec: number | null;
  source: 'SCRIPT' | 'MANUAL';
}

interface ResolvedCover {
  coverUrl: string;
  coverWidth: number | null;
  coverHeight: number | null;
  coverThumbUrl: string | null;
  coverThumbWidth: number | null;
  coverThumbHeight: number | null;
  coverAlbumId: string | null;
  source: 'SCRIPT' | 'MANUAL';
}

function readResolved<T>(name: string, section: string): Record<string, T> {
  const file = path.join(import.meta.dirname, 'seed-data', `${name}.json`);
  if (!existsSync(file)) return {};

  const parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  return (parsed[section] as Record<string, T> | undefined) ?? {};
}

async function seedResolved(): Promise<{ ids: number; covers: number; orphans: string[] }> {
  const orphans: string[] = [];
  let ids = 0;
  let covers = 0;

  const trackIds = readResolved<ResolvedId>('spotify-ids', 'tracks');
  for (const [key, value] of Object.entries(trackIds)) {
    const [albumSlug, rawNumber] = key.split('#');
    const album = await prisma.album.findUnique({ where: { slug: albumSlug } });
    if (!album) {
      orphans.push(`spotify-ids/tracks/${key} (no existe el album)`);
      continue;
    }

    const updated = await prisma.track.updateMany({
      where: { albumId: album.id, trackNumber: Number(rawNumber) },
      data: {
        spotifyId: value.spotifyId,
        durationSec: value.durationSec,
        spotifyIdSource: value.source,
      },
    });

    if (updated.count === 0) orphans.push(`spotify-ids/tracks/${key} (no existe la pista)`);
    else ids += updated.count;
  }

  const workIds = readResolved<ResolvedId>('spotify-ids', 'soloWorks');
  for (const [slug, value] of Object.entries(workIds)) {
    const updated = await prisma.soloWork.updateMany({
      where: { slug },
      data: {
        spotifyId: value.spotifyId,
        durationSec: value.durationSec,
        spotifyIdSource: value.source,
      },
    });

    if (updated.count === 0) orphans.push(`spotify-ids/soloWorks/${slug}`);
    else ids += updated.count;
  }

  const soloTrackIds = readResolved<ResolvedId>('spotify-ids', 'soloTracks');
  for (const [key, value] of Object.entries(soloTrackIds)) {
    const [workSlug, rawNumber] = key.split('#');
    const work = await prisma.soloWork.findUnique({ where: { slug: workSlug } });
    if (!work) {
      orphans.push(`spotify-ids/soloTracks/${key} (no existe la obra)`);
      continue;
    }

    const updated = await prisma.soloTrack.updateMany({
      where: { soloWorkId: work.id, trackNumber: Number(rawNumber) },
      data: {
        spotifyId: value.spotifyId,
        durationSec: value.durationSec,
        spotifyIdSource: value.source,
      },
    });

    if (updated.count === 0) orphans.push(`spotify-ids/soloTracks/${key} (no existe la pista)`);
    else ids += updated.count;
  }

  const albumCovers = readResolved<ResolvedCover>('spotify-covers', 'albums');
  for (const [slug, value] of Object.entries(albumCovers)) {
    const updated = await prisma.album.updateMany({
      where: { slug },
      data: {
        coverUrl: value.coverUrl,
        coverWidth: value.coverWidth,
        coverHeight: value.coverHeight,
        coverThumbUrl: value.coverThumbUrl,
        coverThumbWidth: value.coverThumbWidth,
        coverThumbHeight: value.coverThumbHeight,
        coverAlbumId: value.coverAlbumId,
        coverSource: value.source,
      },
    });

    if (updated.count === 0) orphans.push(`spotify-covers/albums/${slug}`);
    else covers += updated.count;
  }

  const workCovers = readResolved<ResolvedCover>('spotify-covers', 'soloWorks');
  for (const [slug, value] of Object.entries(workCovers)) {
    const updated = await prisma.soloWork.updateMany({
      where: { slug },
      data: {
        coverUrl: value.coverUrl,
        coverWidth: value.coverWidth,
        coverHeight: value.coverHeight,
        coverThumbUrl: value.coverThumbUrl,
        coverThumbWidth: value.coverThumbWidth,
        coverThumbHeight: value.coverThumbHeight,
        coverAlbumId: value.coverAlbumId,
        coverSource: value.source,
      },
    });

    if (updated.count === 0) orphans.push(`spotify-covers/soloWorks/${slug}`);
    else covers += updated.count;
  }

  return { ids, covers, orphans };
}

async function report(resolved: { ids: number; covers: number; orphans: string[] }): Promise<void> {
  const rows = await Promise.all([
    prisma.member.count(),
    prisma.album.count(),
    prisma.track.count(),
    prisma.soloWork.count(),
    prisma.soloTrack.count(),
    prisma.timelineEvent.count(),
    prisma.trivia.count(),
    prisma.award.count(),
    prisma.quizQuestion.count(),
  ]);

  const verified = await Promise.all([
    prisma.timelineEvent.count({ where: { verified: true } }),
    prisma.trivia.count({ where: { verified: true } }),
    prisma.quizQuestion.count({ where: { verified: true } }),
    prisma.award.count({ where: { verified: true } }),
  ]);

  const [members, albums, tracks, soloWorks, soloTracks, timeline, trivia, awards, quiz] = rows;
  const [timelineOk, triviaOk, quizOk, awardsOk] = verified;

  const translations = await prisma.memberTranslation.count();

  console.log('');
  console.log('  Contenido cargado');
  console.log('  ─────────────────────────────────────────────');
  console.log(`  Integrantes            ${members}`);
  console.log(`  Albumes                ${albums}`);
  console.log(`  Canciones              ${tracks}`);
  console.log(`  Trabajo en solitario   ${soloWorks}   (${soloTracks} canciones)`);
  console.log(`  Hitos de cronologia    ${timeline}   (${timelineOk} verificados)`);
  console.log(`  Curiosidades           ${trivia}   (${triviaOk} verificadas)`);
  console.log(`  Premios                ${awards}   (${awardsOk} verificados)`);
  console.log(`  Preguntas de quiz      ${quiz}   (${quizOk} verificadas)`);
  console.log(`  Traducciones de ficha  ${translations}`);
  console.log(`  Identificadores        ${resolved.ids}   (volcado de Spotify)`);
  console.log(`  Portadas               ${resolved.covers}   (volcado de Spotify)`);
  console.log('');

  if (resolved.orphans.length > 0) {
    console.log('  AVISO: hay entradas de un volcado que no casan con ninguna fila.');
    console.log('  Suele significar que un slug se renombro y el volcado quedo atras.');
    for (const orphan of resolved.orphans) console.log(`    - ${orphan}`);
    console.log('');
  }

  console.log('  Lo marcado como no verificado NO se publica: el sitio filtra');
  console.log('  por `verified`. Contrastalo contra su `source` antes de activarlo.');
  console.log('');
}

async function main(): Promise<void> {
  validate();
  console.log('Validacion previa correcta. Cargando contenido...');

  const memberIds = await seedMembers();
  await seedAlbums();
  await seedSoloWorks(memberIds);
  await seedTimeline(memberIds);
  await seedTrivia(memberIds);
  await seedAwards();
  await seedQuiz();

  const resolved = await seedResolved();

  await report(resolved);
}

main()
  .catch((error: unknown) => {
    console.error('\nEl seed ha fallado:\n');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
