// Construye las URL del reproductor oficial de Spotify.

export interface EmbedTarget {
  id: string;
  embedUrl: string;
  watchUrl: string;
}

export interface TrackEmbed {
  trackId: string;
  title: string;
  album: { slug: string; title: string; year: number } | null;
  spotify: EmbedTarget | null;
  available: boolean;
  note: string | null;
}

export function buildSpotifyEmbed(id: string | null): EmbedTarget | null {
  if (!id) return null;
  return {
    id,
    embedUrl: `https://open.spotify.com/embed/track/${encodeURIComponent(id)}`,
    watchUrl: `https://open.spotify.com/track/${encodeURIComponent(id)}`,
  };
}

export const NO_EMBED_NOTE =
  'Todavia no hay identificador oficial para esta cancion. No se inventa: se deja vacio hasta resolverlo contra la API de Spotify.';
