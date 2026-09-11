import { Container } from '@blackpink/ui';

export interface PageHeaderProps {
  title: string;
  description: string;
  /** Dato de contexto a la derecha: recuento, ano, formato. */
  aside?: string;
}

/**
 * Cabecera de pagina.
 *
 * Sin antetitulo: el titular carga su propio peso. El filete inferior enlaza
 * con el mismo ritmo editorial de las secciones de contenido.
 *
 * EL TITULO BAJA UN ESCALON EN MOVIL Y PUEDE PARTIRSE CON GUION.
 *
 * `--text-5xl` es `clamp(3rem, 1.5rem + 7vw, 6.5rem)`: por debajo de unos
 * 430px de ancho toca su suelo de 48px y deja de encoger. A 375px eso deja
 * 50px de tipo para una caja de 327, y una palabra de doce letras mide 512.
 * El titulo se salia de su caja y `html { overflow-x: hidden }` lo cortaba
 * en seco: «Curiosidades» se leia «Curiosidad», y en escritorio no se ve.
 * Medido: Curiosidades se salia 177px, Comparador 173, Integrantes 106 y
 * Discografia 111.
 *
 * La rampa pasa a ser `3xl → 4xl` y SE QUEDA AHI. Con `text-5xl` el problema
 * no era solo el movil: a 1024 el titulo mide 95px y «Curiosidades» ocupa 976
 * en una caja de 942, asi que la ultima `s` se cortaba tambien en un portatil.
 * Es un defecto que ya estaba y que en escritorio ancho no se ve. Topado en
 * `text-4xl` (64px) cabe en todas las anchuras, y 64px siguen siendo un
 * titular de revista.
 *
 * `hyphens-auto` se queda como red, no como solucion: MEDIDO, no cumple.
 * Chrome trae sus diccionarios de particion por el actualizador de
 * componentes y en un perfil limpio no estan, asi que un titulo demasiado
 * largo NO se parte por silabas. Sirve donde el diccionario existe y no
 * estorba donde no; lo que garantiza que quepa es el tamano, no el guion.
 */
export function PageHeader({ title, description, aside }: PageHeaderProps) {
  return (
    <Container width="wide" className="pb-block pt-block">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-display text-fg hyphens-auto text-balance text-3xl font-extrabold sm:text-4xl">
            {title}
          </h1>
          <p className="text-fg-muted mt-4 max-w-prose text-pretty text-lg">{description}</p>
        </div>
        {aside ? (
          <p data-numeric className="text-fg-subtle text-2xs shrink-0" data-uppercase>
            {aside}
          </p>
        ) : null}
      </div>
    </Container>
  );
}
