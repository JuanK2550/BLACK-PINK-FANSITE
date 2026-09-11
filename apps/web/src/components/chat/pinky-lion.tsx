'use client';

import { useId } from 'react';
import type { PinkyState } from './pinky-avatar';

/**
 * ============================================================================
 * PINKY - EL LEON
 * ============================================================================
 * PERSONAJE ORIGINAL de este sitio. No imita a ningun personaje de ninguna
 * pelicula ni de ningun estudio: lo que se copia son PRINCIPIOS de dibujo de
 * personajes, que no son de nadie.
 *
 * LOS CINCO PRINCIPIOS, Y DONDE ESTAN EN EL CODIGO:
 *
 * 1. FORMAS GRANDES QUE SE LEEN EN SILUETA. Tres masas y se acabo: melena,
 *    cabeza y cuerpo. Tapando el detalle, la silueta sigue diciendo leon
 *    porque la melena es el 55% del dibujo.
 * 2. OJOS GRANDES CON PARPADOS QUE CAMBIAN DE FORMA. Cada ojo lleva un
 *    parpado propio (`bp-ln-lid-*`) que baja, se inclina o se curva segun el
 *    estado. Son la mitad de la expresion y por eso no son solo dos puntos.
 * 3. REDONDEZ. Ni una arista: todo son circulos, elipses y curvas cubicas.
 *    Hasta la nariz, que en un leon real es un triangulo, aqui es un triangulo
 *    con las tres esquinas redondeadas.
 * 4. PROPORCIONES DE PERSONAJE. La cabeza mide casi lo mismo que el cuerpo, y
 *    con la melena lo supera. Un leon con proporciones reales es un gato
 *    grande; uno con la cabeza enorme es un personaje.
 * 5. VOLUMEN CON LUZ Y SOMBRA, NO CON LINEAS. `--bp-pinky-fur-hi` arriba y
 *    `--bp-pinky-fur-sh` abajo. A 64px una linea de detalle es suciedad.
 *
 * LA MELENA ES LO QUE DECIDE TODO, y es lo que puede arruinarlo. NO es un
 * circulo con picos: son 16 mechones circulares de radios DISTINTOS (14 a 21)
 * repartidos a distancias tambien distintas del centro. Esa irregularidad es
 * la diferencia entre pelo y engranaje. Ver `MANE`.
 *
 * LA LECCION DE LA ARDILLA SIGUE VIGENTE: es un personaje oscuro sobre fondo
 * oscuro. Filete claro en cada pieza, los miembros salen de la silueta, y las
 * palmas van en crema. Aqui hay una ayuda mas que la ardilla no tenia: el
 * pelaje es CALIDO y la melena NEGRA, asi que la cara se separa sola de la
 * melena sin depender del filete.
 *
 * CONTRATO INTACTO. Mismos props y mismos cinco estados que `PinkySquirrel`:
 * lo unico que cambia es el dibujo. `chat-widget`, `chat-panel` y `use-chat`
 * no se han tocado.
 * ============================================================================
 */

export interface PinkyLionProps {
  state?: PinkyState;
  /** Con movimiento reducido se conserva el personaje y se quita el meneo. */
  reducedMotion?: boolean;
  /**
   * Gesto puntual que se reproduce una vez sobre el estado de reposo.
   * Lo decide `use-pinky-gestures`; aqui solo se pinta.
   */
  gesture?: PinkyGesture | null;
  className?: string;
}

/** Los gestos que sabe hacer. `null` = ninguno ahora mismo. */
export type PinkyGesture =
  'stretch' | 'scratch' | 'chase-tail' | 'shake-mane' | 'hop' | 'sit-look' | 'peek' | 'roar';

export const PINKY_GESTURES: PinkyGesture[] = [
  'stretch',
  'scratch',
  'chase-tail',
  'shake-mane',
  'hop',
  'sit-look',
  'peek',
  'roar',
];

/** Filete comun a las piezas de pelaje. Ver la lección de la ardilla. */
const RIM = { stroke: 'var(--bp-pinky-line)', strokeWidth: 2 } as const;

/**
 * Los mechones: [cx, cy, r].
 *
 * Repartidos alrededor de (100, 78) a distancias entre 38 y 50, con radios
 * entre 14 y 21. NI LAS DISTANCIAS NI LOS RADIOS SIGUEN UN PATRON, y es
 * deliberado: en cuanto se repiten, la melena se lee como una tuerca. Los de
 * arriba son mas grandes -es donde el pelo cae con mas volumen- y los de
 * abajo, junto al cuello, mas pequenos.
 */
const MANE: [number, number, number][] = [
  [100, 20, 24],
  [125, 25, 18],
  [145, 40, 22],
  [156, 61, 16],
  [160, 84, 20],
  [153, 104, 17],
  // Por abajo los mechones se ENCOGEN y suben: es el cuello, y ahi el pelo no
  // tiene el volumen de la corona. Ademas era lo que se comia el cuerpo: el
  // leon se leia como una cabeza con patas.
  [138, 118, 15],
  [120, 126, 13],
  [100, 129, 14],
  [80, 126, 13],
  [62, 118, 15],
  [47, 104, 17],
  [40, 84, 20],
  [44, 61, 16],
  [55, 40, 23],
  [75, 25, 19],
];

export function PinkyLion({
  state = 'idle',
  reducedMotion = false,
  gesture = null,
  className,
}: PinkyLionProps) {
  // Un id por instancia: el laboratorio pinta quince leones a la vez y dos
  // gradientes con el mismo id harian que todos usaran el primero.
  const uid = useId().replace(/:/g, '');
  const halo = `pinky-halo-${uid}`;
  const belly = `pinky-belly-${uid}`;
  const eyeClip = `pinky-eye-${uid}`;

  return (
    <div className={className} aria-hidden>
      <svg
        viewBox="14 -16 172 214"
        className="bp-ln h-full w-full"
        data-state={state}
        data-gesture={gesture ?? undefined}
        data-reduced={reducedMotion ? 'true' : 'false'}
        role="presentation"
      >
        <defs>
          <radialGradient id={halo} cx="50%" cy="46%" r="52%">
            <stop offset="0%" stopColor="var(--bp-accent)" stopOpacity="0.18" />
            <stop offset="62%" stopColor="var(--bp-accent)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--bp-accent)" stopOpacity="0" />
          </radialGradient>

          {/* Volumen del vientre: claro arriba, apagado abajo. Es la regla 5 y
              cuesta un gradiente en vez de tres lineas de sombreado. */}
          <linearGradient id={belly} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bp-pinky-cream)" />
            <stop offset="100%" stopColor="var(--bp-pinky-belly)" />
          </linearGradient>

          {/*
            EL PARPADO SE RECORTA AL OJO, y sin esto se veia el fallo: el
            parpado es una elipse del color del pelaje que en reposo descansa
            por encima del ojo, y ahi ya se sale de la cara. Sobre la cara no
            se nota -mismo color-, pero por arriba invade la MELENA, que es
            negra, y dejaba dos manchas claras flotando sobre el pelo.
            Recortado, el parpado puede moverse a donde haga falta sin ensuciar
            nada, que es justo lo que necesitan los gestos: en el bostezo baja
            25px y en el rugido, 11.
          */}
          <clipPath id={`${eyeClip}-l`}>
            <ellipse cx="85" cy="74" rx="11" ry="12.5" />
          </clipPath>
          <clipPath id={`${eyeClip}-r`}>
            <ellipse cx="115" cy="74" rx="11" ry="12.5" />
          </clipPath>
        </defs>

        {/* Despega a PINKY del fondo sin dibujarle un marco alrededor. */}
        <circle cx="100" cy="90" r="82" fill={`url(#${halo})`} />

        {/* --------------------------------------------- postura del estado */}
        <g className="bp-ln-lean">
          {/* ===================================================== PATAS ====
              Fuera del grupo que respira: unas patas que suben y bajan con el
              pecho no son un leon respirando, son uno flotando. */}
          <g className="bp-ln-legs">
            <ellipse cx="84" cy="180" rx="14" ry="9" fill="var(--bp-pinky-fur)" {...RIM} />
            <ellipse cx="116" cy="180" rx="14" ry="9" fill="var(--bp-pinky-fur)" {...RIM} />
            {/* Las almohadillas, en crema: es lo unico claro que se mueve y es
                lo que hace legible un gesto de pata sobre fondo negro. */}
            <ellipse cx="84" cy="181" rx="6.5" ry="4" fill="var(--bp-pinky-cream)" />
            <ellipse cx="116" cy="181" rx="6.5" ry="4" fill="var(--bp-pinky-cream)" />
          </g>

          <g className="bp-ln-breath">
            <g className="bp-ln-beat">
              {/* ================================================== LA COLA ==
                  Sale por detras del cuerpo, sube, y acaba en borla. La borla
                  lleva el rosa: es el remate del personaje. */}
              <g className="bp-ln-tail-pose">
                <g className="bp-ln-tail-loop">
                  <path
                    d="M128 164C156 166 170 150 168 132"
                    fill="none"
                    stroke="var(--bp-pinky-line)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path
                    d="M128 164C156 166 170 150 168 132"
                    fill="none"
                    stroke="var(--bp-pinky-fur)"
                    strokeWidth="13"
                    strokeLinecap="round"
                  />
                  {/* La borla: tres lobulos de distinto tamano, no una bola. */}
                  {/* La borla es negra sobre negro y necesita las dos ayudas
                      de la ardilla a la vez: filete en cada lobulo Y el rosa
                      por dentro. Sin filete solo se veia el punto rosa, que se
                      leia como un adorno colgando de un cable. */}
                  <g className="bp-ln-tuft">
                    <circle cx="166" cy="123" r="13" fill="var(--bp-pinky-mane)" {...RIM} />
                    <circle cx="157" cy="115" r="9" fill="var(--bp-pinky-mane)" {...RIM} />
                    <circle cx="175" cy="114" r="8" fill="var(--bp-pinky-mane)" {...RIM} />
                    <circle cx="166" cy="119" r="7" fill="var(--bp-accent)" opacity="0.9" />
                    <circle cx="157" cy="113" r="3.4" fill="var(--bp-accent)" opacity="0.55" />
                  </g>
                </g>
              </g>

              {/* ==================================================== CUERPO == */}
              <ellipse cx="100" cy="152" rx="32" ry="28" fill="var(--bp-pinky-fur)" {...RIM} />
              {/* Sombra en la parte baja del cuerpo. Regla 5. */}
              <ellipse
                cx="100"
                cy="165"
                rx="28"
                ry="14"
                fill="var(--bp-pinky-fur-sh)"
                opacity="0.55"
              />
              {/* Mas pequeno y desplazado abajo: a 20 de radio y centrado era la
                  mancha clara mas grande del dibujo y le robaba el ojo a la
                  cara, que es donde tiene que mirar quien lo ve. */}
              <ellipse cx="100" cy="160" rx="17" ry="16" fill={`url(#${belly})`} />

              {/* =========================================== BRAZO DERECHO ==
                  Quieto: es el lado de la cola y cualquier gesto suyo se
                  pierde detras. */}
              <g className="bp-ln-arm-r-pose">
                <path
                  d="M126 140C138 148 144 160 142 172"
                  fill="none"
                  stroke="var(--bp-pinky-line)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M126 140C138 148 144 160 142 172"
                  fill="none"
                  stroke="var(--bp-pinky-fur)"
                  strokeWidth="13"
                  strokeLinecap="round"
                />
                <circle cx="142" cy="172" r="9.5" fill="var(--bp-pinky-fur)" {...RIM} />
                <circle cx="142" cy="173" r="5.5" fill="var(--bp-pinky-cream)" />
              </g>

              {/* ================================================== CABEZA == */}
              <g className="bp-ln-head-pose">
                <g className="bp-ln-head-loop">
                  {/* --- LA MELENA -------------------------------------------
                      Dos pasadas de los mismos mechones:

                      1. Desplazados hacia FUERA y en rosa: al taparlos con los
                         negros queda un reborde rosa en el contorno exterior.
                         Es "reflejos rosa en las puntas" sin pegar lunares.
                      2. En negro, en su sitio.

                      Y una elipse de relleno debajo, porque solo con circulos
                      quedarian huecos entre mechon y mechon. --- */}
                  <g className="bp-ln-mane">
                    {MANE.map(([cx, cy, r], index) => {
                      // Desplazamiento radial desde el centro de la cabeza.
                      const dx = (cx - 100) * 0.055;
                      const dy = (cy - 79) * 0.055;
                      return (
                        <circle
                          key={`tip-${index}`}
                          cx={cx + dx}
                          cy={cy + dy}
                          r={r}
                          fill="var(--bp-accent)"
                          /*
                           * 0.28 y no 0.5. A 0.5 el reborde dejaba de ser un
                           * reflejo y se convertia en un MARCO festoneado rosa
                           * alrededor de la cabeza: lo primero que veia el ojo
                           * era el borde, no el leon. Un reflejo se insinua.
                           */
                          opacity="0.22"
                        />
                      );
                    })}

                    <ellipse cx="100" cy="76" rx="54" ry="50" fill="var(--bp-pinky-mane)" />

                    {MANE.map(([cx, cy, r], index) => (
                      <circle key={index} cx={cx} cy={cy} r={r} fill="var(--bp-pinky-mane)" />
                    ))}

                    {/* Luz en la parte de arriba de la melena. Regla 5. */}
                    <ellipse
                      cx="100"
                      cy="52"
                      rx="38"
                      ry="20"
                      fill="var(--bp-pinky-mane-hi)"
                      opacity="0.55"
                    />
                  </g>

                  {/* --- OREJAS. Asoman por encima de la melena, pequenas y
                         redondas. Un leon no tiene orejas de conejo -esa fue
                         la trampa de la ardilla- y aqui ademas compiten con
                         la melena: grandes, la ensucian. --- */}
                  {/* ELIPSES INCLINADAS, NO CIRCULOS. Con circulos perfectos
                      las orejas se leian a pompon -o a raton-, y basto con
                      inclinarlas 26 grados y alargarlas para que volvieran a
                      ser orejas. */}
                  <g className="bp-ln-ear-l">
                    <ellipse
                      cx="66"
                      cy="35"
                      rx="9.5"
                      ry="12.5"
                      transform="rotate(-26 66 35)"
                      fill="var(--bp-pinky-fur)"
                      {...RIM}
                    />
                    <ellipse
                      cx="67"
                      cy="37"
                      rx="4.8"
                      ry="6.6"
                      transform="rotate(-26 67 37)"
                      fill="var(--bp-pinky-ear)"
                    />
                  </g>
                  <g className="bp-ln-ear-r">
                    <ellipse
                      cx="134"
                      cy="35"
                      rx="9.5"
                      ry="12.5"
                      transform="rotate(26 134 35)"
                      fill="var(--bp-pinky-fur)"
                      {...RIM}
                    />
                    <ellipse
                      cx="133"
                      cy="37"
                      rx="4.8"
                      ry="6.6"
                      transform="rotate(26 133 37)"
                      fill="var(--bp-pinky-ear)"
                    />
                  </g>

                  {/* --- LA CARA ------------------------------------------- */}
                  <circle cx="100" cy="80" r="33" fill="var(--bp-pinky-fur)" {...RIM} />
                  {/* Luz arriba, sombra abajo: el volumen de la regla 5. */}
                  <ellipse
                    cx="100"
                    cy="66"
                    rx="28"
                    ry="17"
                    fill="var(--bp-pinky-fur-hi)"
                    opacity="0.5"
                  />
                  <ellipse
                    cx="100"
                    cy="104"
                    rx="26"
                    ry="12"
                    fill="var(--bp-pinky-fur-sh)"
                    opacity="0.45"
                  />

                  {/* Rubor. Debajo del hocico para que no lo manche. */}
                  <ellipse
                    cx="72"
                    cy="90"
                    rx="8"
                    ry="5.5"
                    fill="var(--bp-pinky-blush)"
                    opacity="0.65"
                  />
                  <ellipse
                    cx="128"
                    cy="90"
                    rx="8"
                    ry="5.5"
                    fill="var(--bp-pinky-blush)"
                    opacity="0.65"
                  />

                  {/* --- HOCICO: dos lobulos, no un ovalo. Es lo que da el
                         morro de felino sin dibujar una sola linea. --- */}
                  <g className="bp-ln-muzzle">
                    <ellipse cx="90" cy="97" rx="15" ry="12" fill="var(--bp-pinky-cream)" />
                    <ellipse cx="110" cy="97" rx="15" ry="12" fill="var(--bp-pinky-cream)" />

                    {/* Nariz: triangulo con las tres esquinas redondeadas. */}
                    <path
                      d="M100 84.5C106.5 84.5 109.5 87 108.5 89.5C107.5 92 103 94.5 100 94.5C97 94.5 92.5 92 91.5 89.5C90.5 87 93.5 84.5 100 84.5Z"
                      fill="var(--bp-accent)"
                    />
                    <ellipse
                      cx="97"
                      cy="87.5"
                      rx="2.4"
                      ry="1.6"
                      fill="var(--bp-pinky-cream)"
                      opacity="0.5"
                    />

                    {/* Boca. Dos curvas y punto: la sonrisa de gato. */}
                    <path
                      d="M100 94.5V99M100 99C96.5 103.5 91.5 103 89.5 100.5M100 99C103.5 103.5 108.5 103 110.5 100.5"
                      fill="none"
                      stroke="var(--bp-pinky-fur-sh)"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>

                  {/* --- OJOS. La mitad de la expresion. --------------------
                      Cada uno es: blanco + iris + brillo, y ENCIMA un parpado
                      del color del pelaje que baja y cambia de forma. Es el
                      parpado el que hace la expresion, no la ceja: bajandolo
                      recto sale sueno, inclinandolo hacia dentro sale
                      concentracion, y hacia fuera, pena. --- */}
                  <g className="bp-ln-eyes">
                    <g className="bp-ln-eye-l">
                      <ellipse cx="85" cy="74" rx="11" ry="12.5" fill="var(--bp-pinky-cream)" />
                      <circle
                        className="bp-ln-iris"
                        cx="85"
                        cy="75"
                        r="7"
                        fill="var(--bp-pinky-eye)"
                      />
                      <circle cx="82" cy="71" r="3.2" fill="var(--bp-pinky-cream)" />
                      <circle
                        cx="88"
                        cy="78.5"
                        r="1.6"
                        fill="var(--bp-pinky-cream)"
                        opacity="0.6"
                      />
                      {/* El parpado tapa desde arriba. En reposo esta fuera. */}
                      {/*
                        EL RECORTE VA EN EL PADRE, QUE NO SE MUEVE.
                        Estaba en el mismo grupo que el parpado y era inutil:
                        en SVG el `clip-path` de un elemento se transforma CON
                        el elemento, asi que el recorte bajaba junto al parpado
                        y este nunca llegaba a tapar el ojo. Se veia clarisimo
                        en el bostezo: el leon bostezaba con los ojos como
                        platos. Con el recorte en un padre quieto, el parpado
                        recorre lo que quiera y solo se pinta dentro del ojo.
                      */}
                      <g clipPath={`url(#${eyeClip}-l)`}>
                        <g className="bp-ln-lid-l">
                          <ellipse cx="85" cy="46" rx="15" ry="15" fill="var(--bp-pinky-fur)" />
                        </g>
                      </g>
                    </g>

                    <g className="bp-ln-eye-r">
                      <ellipse cx="115" cy="74" rx="11" ry="12.5" fill="var(--bp-pinky-cream)" />
                      <circle
                        className="bp-ln-iris"
                        cx="115"
                        cy="75"
                        r="7"
                        fill="var(--bp-pinky-eye)"
                      />
                      <circle cx="112" cy="71" r="3.2" fill="var(--bp-pinky-cream)" />
                      <circle
                        cx="118"
                        cy="78.5"
                        r="1.6"
                        fill="var(--bp-pinky-cream)"
                        opacity="0.6"
                      />
                      {/*
                        EL RECORTE VA EN EL PADRE, QUE NO SE MUEVE.
                        Estaba en el mismo grupo que el parpado y era inutil:
                        en SVG el `clip-path` de un elemento se transforma CON
                        el elemento, asi que el recorte bajaba junto al parpado
                        y este nunca llegaba a tapar el ojo. Se veia clarisimo
                        en el bostezo: el leon bostezaba con los ojos como
                        platos. Con el recorte en un padre quieto, el parpado
                        recorre lo que quiera y solo se pinta dentro del ojo.
                      */}
                      <g clipPath={`url(#${eyeClip}-r)`}>
                        <g className="bp-ln-lid-r">
                          <ellipse cx="115" cy="46" rx="15" ry="15" fill="var(--bp-pinky-fur)" />
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </g>

              {/* ========================================= BRAZO IZQUIERDO ==
                  El que saluda, el que se rasca y el que se tapa el ojo. Lado
                  libre de cola, a proposito.

                  VA DESPUES DE LA CABEZA, y por eso se pinta DELANTE de ella.
                  Estaba antes, con el brazo derecho, y se veia el fallo al
                  rascarse: la pata subia hasta la oreja y desaparecia detras
                  de la melena. El leon se rascaba por dentro del pelo.

                  Delante del cuerpo tambien es lo correcto: un brazo cuelga
                  por delante del torso, no por dentro. */}
              <g className="bp-ln-arm-l-pose">
                <g className="bp-ln-arm-l-loop">
                  <path
                    d="M74 140C62 148 56 160 58 172"
                    fill="none"
                    stroke="var(--bp-pinky-line)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path
                    d="M74 140C62 148 56 160 58 172"
                    fill="none"
                    stroke="var(--bp-pinky-fur)"
                    strokeWidth="13"
                    strokeLinecap="round"
                  />
                  <circle cx="58" cy="172" r="9.5" fill="var(--bp-pinky-fur)" {...RIM} />
                  <circle cx="58" cy="173" r="5.5" fill="var(--bp-pinky-cream)" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

/**
 * Puede este navegador con el avatar 3D?
 *
 * Solo se pregunta cuando hay un `.glb` propio que cargar: sin modelo, el
 * camino es siempre el SVG y esta comprobacion no llega a ejecutarse.
 */
export function canRender3D(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;

    const nav = navigator as Navigator & { deviceMemory?: number };
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return false;
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2) return false;

    return true;
  } catch {
    return false;
  }
}
