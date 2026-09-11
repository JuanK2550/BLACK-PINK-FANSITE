import { cn } from './cn';
import { ArrowRightIcon } from './icons';

export interface EmbedTargetLike {
  id: string;
  embedUrl: string;
  watchUrl: string;
}

export interface EmbedPlayerProps {
  title: string;
  spotify?: EmbedTargetLike | null;
  labels: {
    /** "Reproductor de Spotify de {título}" */
    spotifyTitle: string;
    openOnSpotify: string;
    /** Por qué no hay reproductor. */
    unavailable: string;
  };
  className?: string;
}

/**
 * ============================================================================
 * REPRODUCTOR OFICIAL
 * ============================================================================
 * REGLA INVIOLABLE: el sitio NO aloja ni sirve audio ni vídeo. Lo único que
 * hay aquí es un iframe al reproductor oficial de Spotify.
 *
 * ES EL ÚNICO REPRODUCTOR DEL SITIO, y va incrustado donde está la canción:
 * en la fila de su tracklist o junto a la obra en solitario. No hay barra
 * flotante. Un reproductor propio prometería controles —play, pausa,
 * siguiente, posición— que el iframe de Spotify no expone a la página que lo
 * incrusta: la interfaz enseñaría un estado inventado junto a un reproductor
 * que hace otra cosa. El control real es el que Spotify pinta aquí dentro.
 *
 * ESTE COMPONENTE NO SE MONTA HASTA QUE ALGUIEN LO PIDE. Quien decide es la
 * fila del tracklist (`track-player.tsx`), y esa es la diferencia entre cargar
 * el JS y las cookies de Spotify siempre o solo a quien quiere escuchar. Ver
 * allí el razonamiento completo.
 *
 * ---------------------------------------------------------------------------
 * LO QUE SÍ PODEMOS CONTROLAR DE UN IFRAME AJENO, Y LO QUE NO
 * ---------------------------------------------------------------------------
 * SÍ:
 *
 * 1. `theme=0`. La única palanca de tema que Spotify expone. Comprobado
 *    contra su propio HTML: sin el parámetro su payload trae
 *    `"isDarkMode":false` y con él, `true`. Sin esto, el reproductor es un
 *    bloque claro flotando sobre `#08070a`.
 *
 * 2. LA ALTURA COMPACTA (80px). Spotify sirve dos maquetaciones para una
 *    pista: la grande de 152px, con carátula, y esta. En un tracklist la
 *    carátula grande es redundante —es la misma del álbum, ya está arriba— y
 *    ocho de 152px ocupaban el 30% del alto de la ficha.
 *
 * 3. EL CONTENEDOR: recorte, filete, ancho y espaciado. Radio 0, porque en
 *    este sistema solo lo que se pulsa lleva esquina redondeada y un
 *    reproductor es superficie, no botón. Antes llevaba `rounded-md` y se leía
 *    como un botón gigante.
 *
 * NO, y conviene no prometerlo:
 *
 * - El verde de Spotify, su tipografía y su espaciado interior. Es contenido
 *   de otro dominio: no se puede teñir ni un píxel.
 * - Su estado de reproducción. No lo expone, y por eso el sitio no tiene ni
 *   tendrá controles propios ni barra flotante.
 * - La altura exacta: 80 o 152, no hay un valor intermedio.
 *
 * ---------------------------------------------------------------------------
 * Y dos decisiones que siguen valiendo:
 *
 * - `sandbox` explícito. Se le concede lo justo para reproducir: scripts,
 *   mismo origen y presentación. Sin `allow-top-navigation`, así que un
 *   reproductor comprometido no puede sacar al visitante del sitio.
 *
 * - Cuando no hay identificador NO se inventa nada: se dice que todavía no
 *   está disponible. Un embed que apunta al sitio equivocado engaña; la
 *   ausencia solo informa.
 * ============================================================================
 */

/** Alto de la maquetación compacta de Spotify. Ver la nota 2 de arriba. */
const COMPACT_HEIGHT = 80;

/**
 * Añade `theme=0` sin pisar lo que ya traiga la URL.
 *
 * Se construye con `URL` y no concatenando: la URL puede venir del builder de
 * media-service con parámetros propios, y un `?theme=0` a pelo produciría dos
 * interrogantes y una ruta que Spotify no reconoce.
 */
function withDarkTheme(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set('theme', '0');
    return url.toString();
  } catch {
    // Una URL relativa o malformada no debe tumbar la ficha entera.
    return embedUrl;
  }
}

export function EmbedPlayer({ title, spotify, labels, className }: EmbedPlayerProps) {
  if (!spotify) {
    return (
      <p className={cn('text-fg-subtle border-line border-t pt-4 text-xs', className)}>
        {labels.unavailable}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <iframe
        src={withDarkTheme(spotify.embedUrl)}
        title={labels.spotifyTitle.replace('{title}', title)}
        height={COMPACT_HEIGHT}
        loading="lazy"
        /*
         * `scrolling="no"`, y sí, está obsoleto en el estándar.
         *
         * Se usa porque no hay alternativa: el reproductor pintaba una barra de
         * desplazamiento vertical en su borde derecho —comprobado, y aparecía
         * TANTO a 80px como a 152, así que no era cuestión de darle más alto—.
         * El interior es de otro dominio, de modo que no se puede tocar con CSS
         * ni con `overflow`. El atributo lo siguen respetando los navegadores y
         * es lo único que la quita.
         */
        scrolling="no"
        allow="encrypted-media; clipboard-write; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        /*
         * Radio 0 y ancho acotado. Un reproductor de 80px a sangre completa
         * -1386px en escritorio- no es una proporcion, es una banda. Acotado a
         * la medida de lectura se lee como parte de la fila.
         */
        className="border-line block w-full max-w-prose rounded-none border-0 border-t"
        style={{ height: COMPACT_HEIGHT }}
      />

      <ExternalLink href={spotify.watchUrl} label={labels.openOnSpotify} />
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group/ext text-fg-muted hover:text-accent-text ease-out-soft focus-visible:outline-focus inline-flex w-fit items-center gap-1.5 text-xs transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      {label}
      <ArrowRightIcon className="ease-out-bp -rotate-45 text-xs transition-transform duration-[var(--dur-2)] group-hover/ext:translate-x-0.5" />
    </a>
  );
}
