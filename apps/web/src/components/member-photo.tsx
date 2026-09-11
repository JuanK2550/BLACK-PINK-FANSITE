import Image from 'next/image';
import { MediaFrame, type MediaRatio } from '@blackpink/ui';
import type { MemberSummary } from '@blackpink/types';

/**
 * ============================================================================
 * LA FOTO DE UNA INTEGRANTE, CON SU CRÉDITO
 * ============================================================================
 * Un único sitio donde se pinta una foto de integrante, y no es manía de
 * centralizar: **la licencia CC BY exige atribución allí donde se usa la
 * obra**. Con la foto y el crédito repartidos por cuatro plantillas, basta que
 * alguien copie el `<Image>` sin el crédito para incumplir la licencia sin
 * enterarse. Aquí no se puede: el crédito viene en el mismo componente.
 *
 * SI FALTA LA FOTO, SE MANTIENE EL MARCO DE RELLENO. `MediaFrame` sin hijos
 * pinta la trama con la inicial, exactamente igual que antes de que hubiera
 * fotos, así que una integrante sin imagen no rompe la rejilla.
 *
 * `width` y `height` salen de la base y son los del ARCHIVO SERVIDO. Con ellos
 * Next reserva el hueco antes de descargar nada y la rejilla no salta.
 *
 * EL RECORTE. El marco es 3:4 (0.75) y las cuatro fotos van de 0.73 a 0.82, así
 * que dos se recortan un poco por los lados. `imageFocus` dice dónde cae la
 * cara en cada una; viaja con la foto porque es una propiedad suya, no del
 * maquetado: el día que se cambie la imagen, el encuadre cambia con ella.
 * ============================================================================
 */

export interface MemberPhotoProps {
  member: Pick<
    MemberSummary,
    | 'stageName'
    | 'imageUrl'
    | 'imageWidth'
    | 'imageHeight'
    | 'imageAlt'
    | 'imageAuthor'
    | 'imageLicense'
    | 'imageFocus'
  >;
  ratio?: MediaRatio;
  /** Acerca la foto al pasar el ratón por el ancestro `group/card`. */
  zoom?: boolean;
  /**
   * `sizes` de `next/image`: le dice al navegador cuánto va a medir la foto en
   * cada anchura de pantalla, para que baje la variante justa y no la mayor.
   * Sin esto Next asume el 100% del viewport y en la rejilla de cuatro
   * columnas descargaría una imagen cuatro veces más grande de la necesaria.
   */
  sizes: string;
  /**
   * Solo para la foto que domina la primera pantalla. Precargarlas todas
   * compite consigo mismo y empeora justo lo que intenta mejorar.
   */
  priority?: boolean;
  /** Sin crédito visible. Ver la nota de `Credit`. */
  hideCredit?: boolean;
  className?: string;
}

export function MemberPhoto({
  member,
  ratio = 'portrait',
  zoom = false,
  sizes,
  priority = false,
  hideCredit = false,
  className,
}: MemberPhotoProps) {
  const { imageUrl, imageWidth, imageHeight } = member;

  // Sin foto o sin medidas, el marco de relleno de siempre. Se exigen las
  // medidas y no solo la ruta: sin ellas habría salto de maquetado, que es
  // peor que no tener foto.
  if (!imageUrl || !imageWidth || !imageHeight) {
    return (
      <MediaFrame
        ratio={ratio}
        glyph={member.stageName.charAt(0)}
        label={member.stageName}
        zoom={zoom}
        className={className}
      />
    );
  }

  return (
    <div className="relative">
      <MediaFrame ratio={ratio} zoom={zoom} className={className}>
        <Image
          src={imageUrl}
          width={imageWidth}
          height={imageHeight}
          sizes={sizes}
          priority={priority}
          /*
           * El alt describe LA FOTO -la ropa, el sitio, el gesto-, no a la
           * persona. «Fotografía de Jisoo» no añade nada al nombre que ya está
           * escrito al lado; «con chaqueta vaquera, el pelo movido por el
           * viento» sí.
           *
           * Cadena vacía si no hay descripción: un alt inventado es peor que
           * ninguno, porque un lector de pantalla lo lee como si fuera cierto.
           */
          alt={member.imageAlt ?? ''}
          className="h-full w-full object-cover"
          style={{ objectPosition: member.imageFocus ?? '50% 30%' }}
        />
      </MediaFrame>

      {hideCredit ? null : <Credit member={member} />}
    </div>
  );
}

/**
 * El crédito, discreto pero VISIBLE.
 *
 * No es letra pequeña que se pueda decidir no poner: es la condición de la
 * licencia. Se coloca sobre la foto, abajo, con un degradado por debajo para
 * que se lea sobre cualquier fondo de imagen sin tapar la cara.
 *
 * `hideCredit` existe solo para el mega-menú, donde las miniaturas miden cien
 * píxeles y una línea de crédito sería ilegible además de ruidosa. Allí la
 * atribución se resuelve como permite la propia licencia cuando el medio no da
 * espacio: con un enlace visible a /creditos en el mismo panel.
 */
function Credit({ member }: { member: MemberPhotoProps['member'] }) {
  if (!member.imageAuthor) return null;

  return (
    <span
      className="text-fg/70 text-2xs pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-4 tracking-normal"
      // Decorativo para el lector de pantalla: la atribución completa y
      // navegable está en /creditos, y leer «CC BY 3.0» en medio de una
      // rejilla de cuatro nombres solo estorba.
      aria-hidden="true"
    >
      © {member.imageAuthor}
      {member.imageLicense ? ` · ${member.imageLicense}` : ''}
    </span>
  );
}
