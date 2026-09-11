import { describe, expect, it, vi } from 'vitest';
import type { ContentClientService } from '../content-client/content-client.service';
import { buildSpotifyEmbed } from './embed.builder';
import { EmbedsService } from './embeds.service';

const baseTrack = {
  id: 't1',
  title: 'Whistle',
  localizedTitle: null,
  trackNumber: 1,
  durationSec: null,
  isTitleTrack: true,
  lyricsAvailable: false,
  verified: true,
  album: { slug: 'square-one', title: 'SQUARE ONE', releaseDate: '2016-08-08' },
};

function clientReturning(track: Record<string, unknown>) {
  return { getTrack: vi.fn().mockResolvedValue(track) } as unknown as ContentClientService;
}

describe('constructor de embeds', () => {
  it('Spotify apunta al reproductor oficial incrustable', () => {
    expect(buildSpotifyEmbed('xyz')?.embedUrl).toBe('https://open.spotify.com/embed/track/xyz');
  });

  it('sin identificador no se inventa una URL', () => {
    expect(buildSpotifyEmbed(null)).toBeNull();
  });

  it('escapa el identificador en la URL', () => {
    expect(buildSpotifyEmbed('a/b?c')?.embedUrl).toContain('a%2Fb%3Fc');
  });
});

describe('EmbedsService', () => {
  it('marca available=false y explica por que cuando no hay identificador', async () => {
    const service = new EmbedsService(clientReturning({ ...baseTrack, spotifyId: null }));

    const result = await service.forTrack('t1', 'es');

    expect(result.available).toBe(false);
    expect(result.spotify).toBeNull();
    expect(result.note).toMatch(/No se inventa/i);
  });

  it('con identificador de Spotify ya es reproducible', async () => {
    const service = new EmbedsService(clientReturning({ ...baseTrack, spotifyId: 'sp1' }));

    const result = await service.forTrack('t1', 'es');

    expect(result.available).toBe(true);
    expect(result.spotify?.watchUrl).toBe('https://open.spotify.com/track/sp1');
    expect(result.note).toBeNull();
  });

  it('NUNCA devuelve una URL de archivo de audio', async () => {
    const service = new EmbedsService(clientReturning({ ...baseTrack, spotifyId: 'sp1' }));

    const result = await service.forTrack('t1', 'es');

    expect(JSON.stringify(result)).not.toMatch(/\.(mp3|m4a|wav|flac|mp4|webm)\b/i);
    expect(result.spotify?.embedUrl).toContain('open.spotify.com');
  });

  /*
   * Spotify es hoy la UNICA fuente. El test lo fija: si alguien vuelve a
   * meter un segundo reproductor sin decidirlo, esto falla y obliga a
   * revisar la decision en vez de que se cuele por un `...spread`.
   */
  it('no expone ninguna fuente que no sea Spotify', async () => {
    const service = new EmbedsService(
      clientReturning({ ...baseTrack, spotifyId: 'sp1', youtubeId: 'yt1' }),
    );

    const result = await service.forTrack('t1', 'es');

    expect(JSON.stringify(result)).not.toMatch(/youtube/i);
  });

  it('prefiere el titulo localizado cuando existe', async () => {
    const service = new EmbedsService(
      clientReturning({ ...baseTrack, localizedTitle: '휘파람', spotifyId: 'sp1' }),
    );

    expect((await service.forTrack('t1', 'ko')).title).toBe('휘파람');
  });

  it('extrae el ano del album de la fecha de publicacion', async () => {
    const service = new EmbedsService(clientReturning({ ...baseTrack, spotifyId: null }));

    expect((await service.forTrack('t1', 'es')).album?.year).toBe(2016);
  });
});
