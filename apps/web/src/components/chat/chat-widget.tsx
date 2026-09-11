'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@blackpink/ui';
import { ChatPanel } from './chat-panel';
import { PinkyStage } from './pinky-stage';
import type { PinkyState } from './pinky-avatar';

/**
 * ============================================================================
 * WIDGET FLOTANTE
 * ============================================================================
 * TRES ESTADOS: burbuja, panel y cerrado. "Minimizar" vuelve a la burbuja
 * conservando la conversacion; "cerrar" tambien la conserva, porque vive en
 * `sessionStorage` y perderla al cerrar sin querer seria cruel.
 *
 * LA BURBUJA SE ARRASTRA, y su posicion se recuerda. No es un capricho: en
 * movil la esquina inferior derecha tapa justo los botones de las tarjetas, y
 * en escritorio se cruza con el reproductor de Spotify de la ficha de album.
 * Que el visitante la aparte es la solucion honesta.
 *
 * LA POSICION SE GUARDA COMO PORCENTAJE, no en pixeles. Guardada en pixeles,
 * quien mueve la burbuja en un monitor grande y abre el sitio en el movil se
 * la encuentra fuera de la pantalla, sin forma de recuperarla.
 * ============================================================================
 */

const POSITION_KEY = 'bp-chat-bubble';
const GREETED_KEY = 'bp-chat-greeted';

/*
 * Coreografia del saludo, en milisegundos desde que carga la pagina.
 *
 * Escalonado a proposito: primero se mueve la ardilla, y solo despues aparece
 * el globo. Al reves, el globo saldria de la nada y PINKY quedaria como su
 * adorno; asi el movimiento lleva la mirada a la esquina y el texto llega a
 * una mirada que ya esta puesta.
 *
 * Y el saludo TERMINA. Un personaje con la pata levantada para siempre deja
 * de estar saludando y pasa a estar congelado.
 */
const WAVE_AT = 2600;
const BALLOON_AT = 3400;
const WAVE_ENDS_AT = 5400;

interface Position {
  /** 0 a 1, relativo al viewport. */
  x: number;
  y: number;
}

const DEFAULT_POSITION: Position = { x: 0.92, y: 0.88 };

export interface ChatWidgetProps {
  /** Ruta a un modelo .glb propio, si lo hay. */
  modelUrl?: string;
}

export function ChatWidget({ modelUrl }: ChatWidgetProps) {
  const t = useTranslations('Chat');
  const reduced = useReducedMotion() ?? false;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [greeting, setGreeting] = useState(false);
  const [unread, setUnread] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [waving, setWaving] = useState(false);

  const bubbleRef = useRef<HTMLDivElement>(null);

  /*
   * DEVOLVER EL FOCO A PINKY AL CERRAR.
   *
   * La burbuja se DESMONTA mientras el panel esta abierto -en su esquina vive
   * el panel- y se vuelve a montar al cerrar. Un elemento nuevo no tiene el
   * foco de nadie, asi que al cerrar con Esc el foco caia al `body` y quien
   * navega con teclado volvia al principio de la pagina. Lo detecto el e2e de
   * Playwright, no una persona.
   *
   * La marca solo se pone al CERRAR, no en el primer montaje: al cargar la
   * pagina nadie ha pedido que el foco vaya a PINKY, y robarlo ahi rompe el
   * enlace de salto y el orden natural de tabulacion.
   */
  const returnFocus = useRef(false);
  const bubbleButtonRef = useCallback((node: HTMLButtonElement | null) => {
    if (node && returnFocus.current) {
      returnFocus.current = false;
      node.focus();
    }
  }, []);

  const closePanel = useCallback(() => {
    returnFocus.current = true;
    setOpen(false);
  }, []);

  /* ------------------------------------------------------------- montaje */

  useEffect(() => {
    setMounted(true);

    try {
      const saved = localStorage.getItem(POSITION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Position;
        // Se acota a la pantalla: un valor corrupto o de otra epoca no puede
        // dejar la burbuja donde no se pueda tocar.
        setPosition({
          x: Math.min(0.96, Math.max(0.04, parsed.x)),
          y: Math.min(0.94, Math.max(0.06, parsed.y)),
        });
      }
    } catch {
      /* sin almacenamiento: se queda en la esquina por defecto */
    }
  }, []);

  /*
   * Saludo proactivo, UNA vez por navegador.
   *
   * Con retraso: aparecer en el primer segundo interrumpe justo cuando la
   * persona esta entendiendo la pagina. Y no abre el panel: solo asoma un
   * globo que se cierra con un clic o ignorandolo.
   */
  useEffect(() => {
    if (!mounted) return;

    // El saludo con la pata es de todas las visitas: es la ardilla estando
    // viva, no un mensaje. El GLOBO si es una sola vez por navegador, porque
    // ese si es un mensaje y repetirlo es insistir.
    let firstTime = false;
    try {
      firstTime = !localStorage.getItem(GREETED_KEY);
    } catch {
      /* sin almacenamiento: se saluda igual, solo que cada vez */
      firstTime = true;
    }

    const timers = [
      setTimeout(() => setWaving(true), WAVE_AT),
      setTimeout(() => {
        if (!firstTime) return;
        setGreeting(true);
        setUnread(true);
        try {
          localStorage.setItem(GREETED_KEY, '1');
        } catch {
          /* da igual: como mucho vuelve a saludar */
        }
      }, BALLOON_AT),
      setTimeout(() => setWaving(false), WAVE_ENDS_AT),
    ];

    return () => timers.forEach(clearTimeout);
  }, [mounted]);

  const savePosition = useCallback((next: Position) => {
    setPosition(next);
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(next));
    } catch {
      /* sin persistencia */
    }
  }, []);

  if (!mounted) return null;

  /*
   * 2.625rem = la mitad de la burbuja (5.25rem): se ancla por el centro, para
   * que el porcentaje guardado signifique lo mismo en cualquier pantalla.
   *
   * Y `clamp()` alrededor, que no es adorno. El recorte de mas abajo limita la
   * FRACCION a 0.04-0.96, y una fraccion no sabe cuanto mide la burbuja: al
   * 92% de 390px el centro cae en 359 y los 42px de la otra mitad se salen de
   * la pantalla. Medido: 2px fuera a 390px y 16px fuera a 320px.
   *
   * Se resuelve en CSS y no con un `resize`: `100%` de un elemento `fixed` es
   * el viewport, asi que el limite se recalcula solo al girar el movil, al
   * abrir el teclado o al cambiar de ventana, sin escuchar nada.
   */
  const bounded = (percent: number) =>
    `clamp(0.75rem, calc(${percent * 100}% - 2.625rem), calc(100% - 6rem))`;

  const left = bounded(position.x);
  const top = bounded(position.y);

  const bubbleState: PinkyState = waving ? 'greeting' : 'idle';

  return (
    <>
      <AnimatePresence>
        {open ? (
          <ChatPanel key="panel" modelUrl={modelUrl} onClose={closePanel} onMinimize={closePanel} />
        ) : null}
      </AnimatePresence>

      {!open ? (
        <motion.div
          ref={bubbleRef}
          drag
          // Al viewport entero: es lo que permite apartarla de donde estorbe.
          dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_, info) => {
            // Se convierte a porcentaje ANTES de guardar. Ver la nota de
            // arriba sobre monitores de distinto tamano.
            const x = (info.point.x || 0) / window.innerWidth;
            const y = (info.point.y || 0) / window.innerHeight;

            savePosition({
              x: Math.min(0.96, Math.max(0.04, x)),
              y: Math.min(0.94, Math.max(0.06, y)),
            });

            // Un clic no debe dispararse al soltar tras arrastrar.
            setTimeout(() => setDragging(false), 0);
          }}
          style={{ left, top }}
          className="fixed z-[75] touch-none"
        >
          <div className="relative">
            {/* --------------------------------------------- saludo proactivo */}
            <AnimatePresence>
              {greeting ? (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                  className="bg-overlay border-line absolute bottom-[5.5rem] right-0 w-60 rounded-md border p-3 shadow-[var(--shadow-lift-1)]"
                  role="status"
                >
                  <p className="text-fg text-pretty text-xs leading-relaxed">{t('proactive')}</p>

                  <div className="mt-2.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setGreeting(false);
                        setUnread(false);
                        setOpen(true);
                      }}
                      className="text-accent-text focus-visible:outline-focus text-2xs underline underline-offset-4 focus-visible:outline-2"
                    >
                      {t('proactiveOpen')}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGreeting(false);
                        setUnread(false);
                      }}
                      className="text-fg-subtle hover:text-fg focus-visible:outline-focus text-2xs focus-visible:outline-2"
                    >
                      {t('proactiveDismiss')}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGreeting(false);
                      setUnread(false);
                    }}
                    aria-label={t('proactiveDismiss')}
                    className="text-fg-subtle hover:text-fg focus-visible:outline-focus absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full focus-visible:outline-2"
                  >
                    <CloseIcon className="text-xs" />
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* ----------------------------------------------------- burbuja
                5.25rem y no 4: la ardilla se pinta ENTERA -cabeza, torso,
                brazos, patas y cola- y a 4rem la cola era una mancha. Se
                agranda el contenedor en vez de recortar al personaje, que es
                justo lo que lo hace reconocible.

                Y el hueco del avatar NO es cuadrado: lleva la proporcion del
                viewBox (137:158). En una caja cuadrada el SVG se ajusta al
                alto y deja aire a los lados, asi que la ardilla salia un 15%
                mas pequena de lo que cabia. */}
            <button
              ref={bubbleButtonRef}
              type="button"
              onClick={() => {
                if (dragging) return;
                setGreeting(false);
                setUnread(false);
                setOpen(true);
              }}
              aria-label={t('open')}
              className="bg-overlay border-line focus-visible:outline-focus ease-out-bp relative grid h-[5.25rem] w-[5.25rem] cursor-grab place-items-center rounded-full border shadow-[var(--shadow-lift-1)] transition-transform duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-[0.97] active:cursor-grabbing"
            >
              <PinkyStage state={bubbleState} modelUrl={modelUrl} className="h-[4.6rem] w-[4rem]" />

              {unread ? (
                <span
                  className="bg-accent border-canvas absolute right-2 top-2 h-3.5 w-3.5 rounded-full border-2"
                  aria-hidden
                />
              ) : null}
            </button>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}
