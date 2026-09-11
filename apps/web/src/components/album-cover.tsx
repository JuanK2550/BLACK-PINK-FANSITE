import Image from 'next/image';
import { MediaFrame, type MediaRatio } from '@blackpink/ui';

/**
 * ============================================================================
 * LA PORTADA DE UN LANZAMIENTO
 * ============================================================================
 * Un unico sitio donde se pinta una portada, por la misma razon que
 * `member-photo.tsx`: la imagen no es nuestra y las condiciones para mostrarla
 * tienen que viajar con ella, no repartirse por cuatro plantillas.
 *
 * TRES DECISIONES QUE NO SON DE ESTILO
 *
 * 1. `unoptimized`. Es la unica de las tres que sorprende, asi que va primero.
 *    `next/image` normalmente descarga la imagen, la reescala y la vuelve a
 *    servir desde nuestro dominio. Con una portada con copyright eso son dos
 *    problemas a la vez: la estariamos ALOJANDO -lo que prohibe la regla 1 del
 *    proyecto- y ademas MODIFICANDO, que es justo lo que los terminos de
 *    Spotify no permiten. Con `unoptimized`, el navegador va directo a
 *    i.scdn.co y nosotros no tocamos el archivo: solo lo enlazamos.
 *
 *    Se sigue usando `next/image` y no un `<img>` pelado porque lo que aporta
 *    aqui no es el optimizador: es reservar el hueco a partir de
 *    `width`/`height` y la carga diferida. Eso se conserva entero.
 *
 * 2. Las MEDIDAS vienen de la base. Como la imagen no pasa por el optimizador,
 *    nadie mas sabe cuanto mide: sin `coverWidth`/`coverHeight` la rejilla
 *    saltaria al cargar cada portada.
 *
 * 3. Si falta la portada, se mantiene el MARCO DE RELLENO. `MediaFrame` sin
 *    hijos pinta la trama con el ano, igual que antes de que hubiera
 *    portadas. Los lanzamientos japoneses no tienen portada resuelta todavia y
 *    tienen que seguir viendose bien.
 * ============================================================================
 */

export interface AlbumCoverProps {
  /**
   * Lo minimo para pintar una portada. Se pide asi y no un `AlbumSummary`
   * entero para que valga tambien con una obra en solitario, que tiene los
   * mismos campos y no es un album.
   */
  cover: {
    coverUrl: string | null;
    coverWidth: number | null;
    coverHeight: number | null;
    coverThumbUrl?: string | null;
    coverThumbWidth?: number | null;
    coverThumbHeight?: number | null;
  };
  /** Titulo del lanzamiento. Etiqueta del marco de relleno. */
  title: string;
  /**
   * Texto alternativo YA TRADUCIDO (`A11y.coverAlt`).
   *
   * Llega como prop en vez de resolverse aqui porque este componente se pinta
   * tanto en servidor -la ficha del album- como dentro del navegador -el
   * buscador de discografia, que es de cliente-, y cada lado lee las
   * traducciones con una funcion distinta. Pedir la cadena ya resuelta es lo
   * unico que funciona en los dos sitios sin duplicar el componente.
   *
   * Lo que NO se hace es escribirla aqui en castellano: un alt es texto
   * visible para quien usa un lector de pantalla, y el sitio habla tres
   * idiomas.
   */
  alt: string;
  /**
   * Que variante de las que publica Spotify se pide.
   *
   * `thumb` para huecos pequenos -las filas de 56px del mega-menu y del
   * listado, los 96px de una obra en solitario-; `full` para cuando la portada
   * es el objeto principal de la pagina.
   *
   * ESTO EXISTE PORQUE `sizes` NO SIRVE AQUI. Con `unoptimized`, Next no
   * genera srcset y el navegador descarga exactamente el archivo que le demos:
   * el de 640px pesa 17,8 KB y el de 300px, 6,1. En el mega-menu son seis
   * miniaturas, o sea 104 KB contra 36.
   *
   * Si no hay variante pequena guardada, cae a la grande: pesada, nunca
   * borrosa.
   */
  variant?: 'full' | 'thumb';
  /** Relleno cuando no hay portada: el ano del lanzamiento. */
  glyph?: string;
  ratio?: MediaRatio;
  zoom?: boolean;
  sizes: string;
  priority?: boolean;
  className?: string;
}

export function AlbumCover({
  cover,
  title,
  alt,
  variant = 'full',
  glyph,
  ratio = 'square',
  zoom = false,
  sizes,
  priority = false,
  className,
}: AlbumCoverProps) {
  /*
   * Se eligen los TRES valores juntos, nunca sueltos. Mezclar la URL pequena
   * con las medidas de la grande reservaria un hueco de 640 para un archivo de
   * 300 y la rejilla saltaria al cargar.
   */
  const useThumb = variant === 'thumb' && Boolean(cover.coverThumbUrl);

  const coverUrl = useThumb ? cover.coverThumbUrl : cover.coverUrl;
  const coverWidth = useThumb ? cover.coverThumbWidth : cover.coverWidth;
  const coverHeight = useThumb ? cover.coverThumbHeight : cover.coverHeight;

  // Se exigen las medidas ademas de la ruta: sin ellas habria salto de
  // maquetado, que se ve peor que el marco de relleno.
  if (!coverUrl || !coverWidth || !coverHeight) {
    return (
      <MediaFrame ratio={ratio} glyph={glyph} label={title} zoom={zoom} className={className} />
    );
  }

  return (
    <MediaFrame ratio={ratio} zoom={zoom} className={className}>
      <Image
        src={coverUrl}
        width={coverWidth}
        height={coverHeight}
        sizes={sizes}
        priority={priority}
        unoptimized
        /*
         * El alt nombra la portada, no repite el titulo a secas: al lado
         * SIEMPRE hay un titulo escrito, y un lector de pantalla que oye dos
         * veces "BORN PINK" seguidas no ha ganado nada. Decir que esto es la
         * portada situa la imagen.
         */
        alt={alt}
        className="h-full w-full object-cover"
      />
    </MediaFrame>
  );
}
