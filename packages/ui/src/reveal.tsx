'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface RevealProps {
  children: ReactNode;
  /** Retardo en segundos. Para escalonar hermanos: 0.04 entre ellos basta. */
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}

/**
 * ============================================================================
 * ENTRADA AL ENTRAR EN PANTALLA
 * ============================================================================
 * Un solo gesto para todo el sitio: subir 16px y aparecer. No hay escala, ni
 * giro, ni desenfoque; el sitio ya tiene su momento de autoría en la portada, y
 * repetir un efecto llamativo en cada bloque lo convierte en ruido.
 *
 * LO QUE ESTÁ FUERA DE PANTALLA SE ESCONDE; LO QUE YA SE VE, NO. Ésta es la
 * regla que sostiene todo lo demás, y llegó después de mirar el HTML servido.
 *
 * Antes, cada `Reveal` salía del servidor como
 * `<div style="opacity:0;transform:translateY(16px)">` y no se veía hasta que
 * Framer Motion hidrataba. Eso hacía dos cosas malas: ataba el LCP al tiempo
 * de hidratación —el bloque más grande de la página estaba invisible por
 * contrato— y dejaba el sitio EN BLANCO sin JavaScript.
 *
 * Ahora el servidor pinta todo visible, y en un efecto de MAQUETADO —que corre
 * después de hidratar y ANTES de pintar— se esconden solo los bloques que
 * están por debajo del borde inferior. Esconder algo que nadie está mirando no
 * se ve; esconder algo que ya se veía sería un parpadeo, y por eso lo que cae
 * en la primera pantalla se queda quieto y visible para siempre.
 *
 * Resultado: el LCP se mide contra la primera pintura, sin JavaScript el
 * contenido sigue ahí, y el gesto se conserva exactamente donde tenía sentido
 * —al bajar por la página—.
 *
 * SE ANIMA UNA VEZ Y NUNCA MÁS. Reanimar al volver a subir hace que la página
 * parezca inestable en cuanto alguien busca algo que ya vio.
 *
 * `rootMargin: '-60px'` dispara la animación un poco ANTES de que el bloque
 * entre del todo, para que termine justo cuando el lector llega a él en vez de
 * empezar cuando ya lo está mirando.
 *
 * ES CSS Y NO FRAMER MOTION. Es un gesto predeterminado de un solo sentido:
 * una animación CSS corre fuera del hilo principal y no necesita que una
 * librería de 40 KB llegue al navegador. Con movimiento reducido no hay
 * desplazamiento, solo opacidad.
 * ============================================================================
 */

/** En el servidor no hay pintura que adelantar; allí el efecto no se ejecuta. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  /**
   * `null` = como salió del servidor: visible y sin animación.
   * `'hidden'` = está por debajo del pliegue y espera su turno.
   * `'shown'` = ha entrado en pantalla y se anima.
   */
  const [state, setState] = useState<null | 'hidden' | 'shown'>(null);

  useIsoLayoutEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    // Lo que ya se ve se queda como está. Solo se esconde lo que nadie mira.
    if (node.getBoundingClientRect().top < window.innerHeight) return;

    setState('hidden');
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (state !== 'hidden' || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setState('shown');
      },
      { rootMargin: '-60px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [state]);

  const Component = as;

  return (
    <Component
      // @ts-expect-error -- el ref es de HTMLElement y la etiqueta es dinámica.
      ref={ref}
      data-reveal={state ?? undefined}
      style={state === 'shown' && delay ? { animationDelay: `${delay}s` } : undefined}
      className={className}
    >
      {children}
    </Component>
  );
}
