'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { PinkyLion, canRender3D } from './pinky-lion';
import { usePinkyGestures } from './use-pinky-gestures';
import type { PinkyState } from './pinky-avatar';

/**
 * ============================================================================
 * QUE PINKY SE DIBUJA, Y QUIEN LE DA CUERDA
 * ============================================================================
 * EL SVG ES EL AVATAR. No el respaldo: el avatar. Tres razones, por orden de
 * peso:
 *
 *   1. Se puede dibujar bien. Un SVG son formas puestas a mano y corregidas
 *      mirando la pantalla, coordenada a coordenada.
 *   2. Three.js son 193 KB. Cobrarselos a todo el mundo por una decoracion
 *      del chat es cobrar el LCP de la portada por algo opcional.
 *   3. Corre en cualquier sitio. Sin WebGL, sin GPU y con la bateria en rojo,
 *      el SVG se pinta igual.
 *
 * EL 3D SIGUE AQUI, ENTERO, y se enciende con una sola condicion: que haya un
 * modelo propio que cargar. `<ChatWidget modelUrl="/pinky.glb" />` y vuelve el
 * camino 3D con sus estados, su seguimiento del cursor y sus luces. Sin
 * `modelUrl` el paquete de Three.js ni se pide.
 *
 * LOS GESTOS VIVEN AQUI y no en `chat-panel`, a proposito: el panel decide en
 * que ESTADO esta PINKY -escuchando, pensando, hablando- y eso es asunto de la
 * conversacion. Que ademas bostece cada doce segundos es asunto del personaje,
 * y el personaje es esto. Asi `chat-widget`, `chat-panel` y `use-chat` no se
 * enteran de que existen los gestos.
 * ============================================================================
 */

const PinkyAvatar = dynamic(
  () => import('./pinky-avatar').then((mod) => ({ default: mod.PinkyAvatar })),
  {
    ssr: false,
    // Mientras baja el modelo se ensena el leon, no un hueco.
    loading: () => <PinkyLion className="h-full w-full" />,
  },
);

export interface PinkyStageProps {
  state: PinkyState;
  /** Ruta a un modelo propio. Sin esto, siempre SVG. */
  modelUrl?: string;
  className?: string;
}

export function PinkyStage({ state, modelUrl, className }: PinkyStageProps) {
  const reduced = useReducedMotion() ?? false;
  const [use3D, setUse3D] = useState(false);
  const { gesture, poke } = usePinkyGestures(state, reduced);

  useEffect(() => {
    // Sin modelo propio no hay nada que valorar. Y la comprobacion va en el
    // efecto, no en el render: `canRender3D` toca el DOM.
    if (!modelUrl) return;
    setUse3D(canRender3D());
  }, [modelUrl]);

  if (modelUrl && use3D) {
    return (
      <PinkyAvatar
        state={state}
        modelUrl={modelUrl}
        reducedMotion={reduced}
        className={className}
      />
    );
  }

  return (
    /*
     * EL CLIC PROVOCA UN GESTO, y es lo que convierte «algo que se mueve» en
     * «algo que responde».
     *
     * Va en un `span` y no en un `button` por una razon concreta: en la
     * burbuja flotante este componente ya vive DENTRO de un boton -el que abre
     * el chat- y un boton dentro de otro es HTML invalido; el navegador
     * deshace el anidamiento y lo que se rompe es el de fuera, que si tiene
     * una funcion.
     *
     * No hay problema de accesibilidad porque no hay nada que perderse: el
     * avatar es `aria-hidden`, el gesto es puramente decorativo y no ofrece
     * ninguna funcion que no este en otro sitio. Un lector de pantalla no
     * anuncia esto ni deberia.
     */
    <span onClick={poke} className={className} style={{ display: 'block' }}>
      <PinkyLion
        state={state}
        gesture={gesture}
        reducedMotion={reduced}
        className="h-full w-full"
      />
    </span>
  );
}
