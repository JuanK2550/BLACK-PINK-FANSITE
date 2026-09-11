/**
 * ============================================================================
 * CONSTRUCCION DE EMBEDS OFICIALES
 * ============================================================================
 * REGLA INVIOLABLE DEL PROYECTO: este servicio NO aloja ni sirve audio ni
 * video. Lo unico que devuelve son identificadores y la URL del reproductor
 * OFICIAL de Spotify, para incrustarlo en un iframe.
 *
 * Si algun dia alguien anade aqui una URL a un archivo de audio, esta rompiendo
 * la regla que sostiene todo el proyecto.
 *
 * UNA SOLA FUENTE. Hubo un camino paralelo para YouTube y se retiro: nunca
 * llego a tener un solo identificador, y un segundo reproductor obligaba a la
 * interfaz a preguntar por cual empezar cuando no habia nada que elegir. Si se
 * retoma, la columna `youtubeId` sigue en el esquema de content-service
 * esperando datos; lo que hay que reescribir aqui son diez lineas.
 * ============================================================================
 */

export interface EmbedTarget {
  /** Identificador en la plataforma. */
  id: string;
  /** URL del reproductor incrustable, para el src de un iframe. */
  embedUrl: string;
  /** URL para abrir la cancion en la plataforma, fuera del sitio. */
  watchUrl: string;
}

export interface TrackEmbed {
  trackId: string;
  title: string;
  album: { slug: string; title: string; year: number } | null;
  spotify: EmbedTarget | null;
  /** false si aun no se conoce el identificador oficial. */
  available: boolean;
  /** Explica por que no hay embed, cuando no lo hay. */
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
