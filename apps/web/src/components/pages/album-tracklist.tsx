'use client';

import { useState } from 'react';
import type { Locale, SoloTrack, Track } from '@blackpink/types';
import { EmbedPlayer, Reveal } from '@blackpink/ui';
import { formatDuration } from '../../lib/format';

/**
 * ============================================================================
 * TRACKLIST CON REPRODUCTOR BAJO DEMANDA
 * ============================================================================
 * La fila ES el control. Se pulsa una canción y su reproductor aparece debajo;
 * se abre UNO CADA VEZ.
 *
 * POR QUÉ NO ESTÁN TODOS PUESTOS, que es como estaba antes:
 *
 * 1. PRIVACIDAD, y es la razón de peso. Un iframe de Spotify no es una imagen:
 *    ejecuta su JavaScript y escribe sus cookies. Con ocho puestos en la
 *    página, cualquiera que abriera la ficha se los llevaba todos sin haber
 *    pedido escuchar nada. `loading="lazy"` no arreglaba esto: retrasa la
 *    carga hasta que el iframe entra en pantalla, y al bajar por el tracklist
 *    entran todos igual. Bajo demanda, el visitante que solo viene a mirar la
 *    lista de canciones no carga nada de Spotify.
 *
 * 2. PESO Y RUIDO VISUAL. Medido en BORN PINK: ocho reproductores de 152px
 *    sumaban 1216px, el 30% del alto de la ficha. La lista de canciones -que
 *    es a lo que se viene- quedaba troceada entre bloques ajenos.
 *
 * 3. El sistema dice que el dato manda. Quien abre la ficha de un álbum viene
 *    casi siempre a comprobar el tracklist, no a escuchar; escuchar es la
 *    excepción y por eso es lo que se pide, no lo que se impone.
 *
 * NO SE ANIMA LA ALTURA. El sistema prohíbe animar `height`, y animar
 * `grid-template-rows` sería la misma prohibición con otro nombre: las dos
 * hacen trabajar al maquetador en cada fotograma. El alto cambia de golpe y lo
 * que se anima es el reproductor entrando —opacidad y 4px de desplazamiento,
 * 180ms— que es transformación pura y se apaga sola con `prefers-reduced-motion`.
 *
 * ACCESIBILIDAD: `button` con `aria-expanded` y `aria-controls`, el mismo
 * patrón que las tarjetas de cronología. No es un `div` con `onClick`.
 * ============================================================================
 */

/**
 * Lo que necesita una fila, venga de un disco del grupo o de una obra en
 * solitario. Las dos pistas comparten casi todo; lo que no comparten es
 * opcional aquí: el título traducido solo existe en el grupo y las invitadas
 * solo en solitario.
 */
export type TracklistItem = Pick<
  Track | SoloTrack,
  'id' | 'title' | 'trackNumber' | 'durationSec' | 'isTitleTrack' | 'spotifyId'
> & {
  localizedTitle?: string | null;
  featuring?: string | null;
};

export interface AlbumTracklistProps {
  tracks: TracklistItem[];
  locale: Locale;
  /**
   * `compact` para las fichas de integrante, donde una lista va DENTRO de cada
   * obra y hay una docena de obras: con las filas de 48px del disco, la ficha
   * de Jennie media más que la discografía entera del grupo.
   */
  density?: 'regular' | 'compact';
  /**
   * Control desde fuera de la pista abierta.
   *
   * La regla es UN reproductor cada vez, y en la ficha de un disco basta con
   * que lo cumpla la lista. En la de una integrante hay una lista POR OBRA:
   * con el estado dentro de cada una, se podían tener doce iframes de Spotify
   * abiertos a la vez, que es justo lo que el montaje bajo demanda existe para
   * evitar. Quien pinta varias listas pasa aquí un estado compartido.
   */
  openId?: string | null;
  onOpenChange?: (id: string | null) => void;
  labels: {
    titleTrack: string;
    /** «con {artists}». Solo hace falta si alguna pista trae invitadas. */
    featuring?: string;
    spotifyTitle: string;
    openOnSpotify: string;
    unavailable: string;
    /*
     * Las dos plantillas del boton, con `{title}` sin sustituir.
     *
     * Llegan como props y NO con `useTranslations('Embed')` aqui dentro: para
     * que un componente de cliente lea un namespace, ese namespace tiene que
     * ir en `CLIENT_NAMESPACES` y entonces viaja en el bundle de TODAS las
     * paginas, no solo de esta. Se veia el fallo en crudo: el boton salia con
     * `aria-label="Embed.playTrack"`, la clave en vez del texto.
     */
    playTrack: string;
    closeTrack: string;
  };
}

export function AlbumTracklist({
  tracks,
  locale,
  labels,
  density = 'regular',
  openId: controlledOpenId,
  onOpenChange,
}: AlbumTracklistProps) {
  /** El id de la única pista abierta, o null. Uno cada vez, a propósito. */
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const controlled = onOpenChange !== undefined;
  const openId = controlled ? (controlledOpenId ?? null) : localOpenId;
  const setOpenId = controlled ? onOpenChange : setLocalOpenId;

  return (
    <ol className={density === 'compact' ? 'mt-4' : 'mt-block'}>
      {tracks.map((track, index) => {
        const isOpen = openId === track.id;
        const playable = Boolean(track.spotifyId);
        const panelId = `track-player-${track.id}`;
        const displayTitle = track.localizedTitle ?? track.title;

        return (
          <Reveal
            as="li"
            key={track.id}
            delay={Math.min(index, 8) * 0.03}
            className="border-line border-b last:border-b-0"
          >
            <TrackRow
              track={track}
              locale={locale}
              isOpen={isOpen}
              playable={playable}
              panelId={panelId}
              displayTitle={displayTitle}
              density={density}
              featuringText={
                track.featuring && labels.featuring
                  ? labels.featuring.replace('{artists}', track.featuring)
                  : null
              }
              titleTrackLabel={labels.titleTrack}
              toggleLabel={(isOpen ? labels.closeTrack : labels.playTrack).replace(
                '{title}',
                displayTitle,
              )}
              onToggle={() => setOpenId(isOpen ? null : track.id)}
            />

            {/*
             * MONTAJE CONDICIONAL, no `hidden`. Con `hidden` el iframe existe
             * en el DOM y Spotify ya ha cargado su JS y escrito sus cookies:
             * se vería el reproductor oculto pero el rastro sería el mismo.
             * Que no exista es la diferencia.
             */}
            {isOpen && playable ? (
              <div
                id={panelId}
                className={[
                  'bp-track-player',
                  density === 'compact' ? 'pb-4 pl-10' : 'pb-6 pl-11',
                ].join(' ')}
              >
                <EmbedPlayer
                  title={track.title}
                  spotify={{
                    id: track.spotifyId!,
                    embedUrl: `https://open.spotify.com/embed/track/${track.spotifyId}`,
                    watchUrl: `https://open.spotify.com/track/${track.spotifyId}`,
                  }}
                  labels={{
                    spotifyTitle: labels.spotifyTitle,
                    openOnSpotify: labels.openOnSpotify,
                    unavailable: labels.unavailable,
                  }}
                />
              </div>
            ) : null}
          </Reveal>
        );
      })}
    </ol>
  );
}

function TrackRow({
  track,
  locale,
  isOpen,
  playable,
  panelId,
  displayTitle,
  density,
  featuringText,
  titleTrackLabel,
  toggleLabel,
  onToggle,
}: {
  track: TracklistItem;
  locale: Locale;
  isOpen: boolean;
  playable: boolean;
  panelId: string;
  displayTitle: string;
  density: 'regular' | 'compact';
  featuringText: string | null;
  titleTrackLabel: string;
  toggleLabel: string;
  onToggle: () => void;
}) {
  const body = (
    <>
      {/*
       * El número de pista deja sitio al indicador de reproducción. Es el
       * mismo ancho abierto o cerrado: si cambiara, la lista entera bailaría
       * al abrir una fila.
       */}
      <span data-numeric className="text-fg-subtle w-7 shrink-0 text-sm">
        {String(track.trackNumber).padStart(2, '0')}
      </span>

      <div className="min-w-0 flex-1">
        {/*
         * Título y etiqueta en una fila FLEXIBLE que envuelve, no en texto
         * corrido.
         *
         * Es lo que decide qué se parte cuando no cabe, y a 375px se parte
         * algo. Con texto corrido, la etiqueta -que va `nowrap`- empujaba al
         * título y «Pink Venom» se rompía en dos líneas para que cupiera
         * «CANCION PRINCIPAL»: se salvaba la anotación y se estropeaba el
         * nombre de la canción, que es justo al revés de lo que importa.
         *
         * Envolviendo, el navegador prueba primero a ponerlos juntos y, si no
         * caben, baja la ETIQUETA ENTERA a la línea siguiente y le deja al
         * título todo el ancho. El título solo se parte si por sí solo no cabe.
         *
         * En inglés y en coreano la etiqueta es corta y nunca baja; el caso lo
         * provoca el español, que es el idioma por defecto del sitio.
         */}
        <p
          className={[
            'text-fg flex flex-wrap items-baseline gap-x-3',
            density === 'compact' ? 'text-base' : 'text-lg',
          ].join(' ')}
        >
          <span>{displayTitle}</span>
          {/*
           * LA CANCION PRINCIPAL SE MARCA CON TINTA, NO CON UNA CAJA.
           *
           * Antes esto era una cápsula con filete y `rounded-full`, y estaba
           * mal por tres motivos a la vez. El que se veía: «Cancion principal»
           * ocupa dos líneas y un radio completo sobre una caja de dos líneas
           * deja de ser cápsula —se convierte en un óvalo cuyas curvas cortan
           * el texto por los dos lados—. Los otros dos son de sistema: aquí el
           * radio es solo para lo que se pulsa, y esto no se pulsa; y la
           * estructura la hacen filetes de 1px, no cajas cerradas.
           *
           * Quitar el borde además GASTA MENOS ROSA, que es la regla de la
           * casa: el acento ya estaba en el texto, la cápsula lo repetía.
           *
           * `whitespace-nowrap` con el título en un contenedor `min-w-0`: si
           * el espacio aprieta, lo que se parte es el TÍTULO, que puede, y no
           * la etiqueta, que no. Un título en dos líneas es normal; una
           * etiqueta partida es un defecto.
           */}
          {track.isTitleTrack ? (
            <span className="text-accent-text text-2xs whitespace-nowrap" data-uppercase>
              {titleTrackLabel}
            </span>
          ) : null}
        </p>
        {track.localizedTitle && track.localizedTitle !== track.title ? (
          <p className="text-fg-subtle mt-0.5 text-xs">{track.title}</p>
        ) : null}
        {/*
         * Las invitadas, debajo y en tinta tenue. No van en el título: el
         * título es el de la canción, y «Handlebars (feat. Dua Lipa)» mezcla
         * el nombre con el crédito. Tampoco pueden faltar, o la lista le
         * atribuiría a la integrante entera una canción compartida.
         */}
        {featuringText ? <p className="text-fg-subtle mt-0.5 text-xs">{featuringText}</p> : null}
      </div>

      {track.durationSec ? (
        <span data-numeric className="text-fg-muted shrink-0 text-sm">
          {formatDuration(track.durationSec, locale)}
        </span>
      ) : null}
    </>
  );

  // Una pista sin identificador no es pulsable: no habría nada que abrir, y un
  // botón que no hace nada es peor que un texto.
  const pad = density === 'compact' ? 'py-3.5' : 'py-6';

  if (!playable) {
    return <div className={`flex items-baseline gap-4 opacity-70 ${pad}`}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={panelId}
      aria-label={toggleLabel}
      className={[
        `group/track flex w-full items-baseline gap-4 text-left ${pad}`,
        'focus-visible:outline-focus focus-visible:outline-2 focus-visible:-outline-offset-2',
        // El color es lo único que responde al hover: la fila no se mueve ni
        // cambia de fondo, que en una lista larga sería ruido.
        'ease-out-soft transition-colors duration-[var(--dur-2)]',
        isOpen ? 'text-accent-text' : 'hover:text-accent-text',
      ].join(' ')}
    >
      {body}
    </button>
  );
}
