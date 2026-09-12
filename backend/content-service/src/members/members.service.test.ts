// Pruebas del servicio de integrantes.

import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service';
import { MembersService } from './members.service';

const jisooRow = {
  slug: 'jisoo',
  stageName: 'JISOO',
  fullName: 'Kim Ji-soo',
  koreanName: '김지수',
  position: 'Vocalista',
  nationality: 'Corea del Sur',
  birthDate: new Date('1995-01-03T00:00:00.000Z'),
  colorAccent: '#c9a7ff',
  imageUrl: null,
  bio: 'Biografia canonica.',
  socials: { instagram: 'https://www.instagram.com/sooyaaa__/' },
  verified: true,
  translations: [
    {
      locale: 'es',
      position: 'Vocalista',
      nickname: 'La mayor',
      bio: 'Bio ES',
      description: 'Desc ES',
    },
    {
      locale: 'en',
      position: 'Vocalist',
      nickname: 'The eldest',
      bio: 'Bio EN',
      description: null,
    },
  ],
  soloWorks: [],
  trivia: [],
  timelineEvents: [],
};

function fakePrisma(overrides: Record<string, unknown> = {}) {
  return {
    member: {
      findMany: vi.fn().mockResolvedValue([jisooRow]),
      findUnique: vi.fn().mockResolvedValue(jisooRow),
      ...overrides,
    },
  } as unknown as PrismaService;
}

describe('MembersService', () => {
  it('resuelve el papel en el idioma pedido', async () => {
    const service = new MembersService(fakePrisma());

    const [inEnglish] = await service.list('en', false);
    expect(inEnglish?.position).toBe('Vocalist');

    const [inSpanish] = await service.list('es', false);
    expect(inSpanish?.position).toBe('Vocalista');
  });

  it('cae al INGLES cuando falta la traduccion del idioma pedido', async () => {
    const service = new MembersService(fakePrisma());

    const [inKorean] = await service.list('ko', false);
    expect(inKorean?.position).toBe('Vocalist');
  });

  it('cae al campo canonico cuando la traduccion existe pero esta vacia', async () => {
    const service = new MembersService(fakePrisma());
    const detail = await service.findBySlug('jisoo', 'en', false);

    expect(detail.bio).toBe('Bio EN');
    expect(detail.description).toBeNull();
  });

  it('formatea la fecha de nacimiento como YYYY-MM-DD, sin hora', async () => {
    const [member] = await new MembersService(fakePrisma()).list('es', false);
    expect(member?.birthDate).toBe('1995-01-03');
  });

  it('lanza 404 con un mensaje que no menciona la tabla ni la consulta', async () => {
    const prisma = fakePrisma({ findUnique: vi.fn().mockResolvedValue(null) });
    const service = new MembersService(prisma);

    await expect(service.findBySlug('nadie', 'es', false)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findBySlug('nadie', 'es', false)).rejects.toThrow(
      /No existe ninguna integrante/,
    );
  });

  it('filtra el contenido sin contrastar en las relaciones de la ficha', async () => {
    const prisma = fakePrisma();
    await new MembersService(prisma).findBySlug('jisoo', 'es', false);

    const call = vi.mocked(prisma.member.findUnique).mock.calls[0]?.[0] as {
      include: Record<string, { where?: unknown }>;
    };

    expect(call.include.trivia?.where).toEqual({ verified: true });
    expect(call.include.soloWorks?.where).toEqual({ verified: true });
    expect(call.include.timelineEvents?.where).toEqual({ verified: true });
  });

  it('por defecto la lista excluye a quien no esta contrastado', async () => {
    const prisma = fakePrisma();
    await new MembersService(prisma).list('es', false);

    const call = vi.mocked(prisma.member.findMany).mock.calls[0]?.[0];
    expect(call?.where).toEqual({ verified: true });
  });

  it('una ficha sin contrastar responde 404, no un cuerpo a medias', async () => {
    const prisma = fakePrisma({
      findUnique: vi.fn().mockResolvedValue({ ...jisooRow, verified: false }),
    });

    await expect(
      new MembersService(prisma).findBySlug('jisoo', 'es', false),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(new MembersService(prisma).findBySlug('jisoo', 'es', true)).resolves.toMatchObject(
      { slug: 'jisoo', verified: false },
    );
  });

  it('devuelve las canciones de cada obra, en orden y con sus invitadas', async () => {
    const ruby = {
      slug: 'jennie-ruby',
      title: 'Ruby',
      type: 'ALBUM',
      releaseDate: new Date('2025-03-07T00:00:00.000Z'),
      translations: [],
      coverUrl: null,
      coverWidth: null,
      coverHeight: null,
      coverThumbUrl: null,
      coverThumbWidth: null,
      coverThumbHeight: null,
      durationSec: null,
      spotifyId: null,
      verified: true,
      tracks: [
        {
          id: 't2',
          title: 'Handlebars',
          trackNumber: 4,
          durationSec: 185,
          isTitleTrack: false,
          featuring: 'Dua Lipa',
          spotifyId: 'x',
          verified: true,
        },
      ],
    };
    const prisma = fakePrisma({
      findUnique: vi.fn().mockResolvedValue({ ...jisooRow, soloWorks: [ruby] }),
    });

    const detail = await new MembersService(prisma).findBySlug('jisoo', 'es', false);
    expect(detail.soloWorks[0]?.tracks).toEqual([
      {
        id: 't2',
        title: 'Handlebars',
        trackNumber: 4,
        durationSec: 185,
        isTitleTrack: false,
        featuring: 'Dua Lipa',
        spotifyId: 'x',
        verified: true,
      },
    ]);

    const call = vi.mocked(prisma.member.findUnique).mock.calls[0]?.[0] as {
      include: { soloWorks: { include: { tracks: unknown } } };
    };
    expect(call.include.soloWorks.include.tracks).toEqual({
      where: { verified: true },
      orderBy: { trackNumber: 'asc' },
    });
  });

  it('expone las cuentas publicas tal cual, sin transformarlas', async () => {
    const detail = await new MembersService(fakePrisma()).findBySlug('jisoo', 'es', false);
    expect(detail.socials).toEqual({ instagram: 'https://www.instagram.com/sooyaaa__/' });
  });
});
