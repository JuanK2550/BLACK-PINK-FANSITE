// Burbuja flotante de PINKY que abre el chat.
'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@blackpink/ui';
import { ChatPanel } from './chat-panel';
import { PinkyStage } from './pinky/pinky-stage';
import type { PinkyState } from './pinky/pinky-lion';

const POSITION_KEY = 'bp-chat-bubble';
const GREETED_KEY = 'bp-chat-greeted';

const WAVE_AT = 2600;
const BALLOON_AT = 3400;
const WAVE_ENDS_AT = 5400;

interface Position {
  x: number;
  y: number;
}

const DEFAULT_POSITION: Position = { x: 0.92, y: 0.88 };

export function ChatWidget() {
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

  useEffect(() => {
    setMounted(true);

    try {
      const saved = localStorage.getItem(POSITION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Position;
        setPosition({
          x: Math.min(0.96, Math.max(0.04, parsed.x)),
          y: Math.min(0.94, Math.max(0.06, parsed.y)),
        });
      }
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let firstTime = false;
    try {
      firstTime = !localStorage.getItem(GREETED_KEY);
    } catch {
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
          /* da igual */
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

  const bounded = (percent: number) =>
    `clamp(0.75rem, calc(${percent * 100}% - 2.625rem), calc(100% - 6rem))`;

  const left = bounded(position.x);
  const top = bounded(position.y);

  const bubbleState: PinkyState = waving ? 'greeting' : 'idle';

  return (
    <>
      <AnimatePresence>
        {open ? <ChatPanel key="panel" onClose={closePanel} onMinimize={closePanel} /> : null}
      </AnimatePresence>

      {!open ? (
        <motion.div
          ref={bubbleRef}
          drag
          dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_, info) => {
            const x = (info.point.x || 0) / window.innerWidth;
            const y = (info.point.y || 0) / window.innerHeight;

            savePosition({
              x: Math.min(0.96, Math.max(0.04, x)),
              y: Math.min(0.94, Math.max(0.06, y)),
            });

            setTimeout(() => setDragging(false), 0);
          }}
          style={{ left, top }}
          className="fixed z-[75] touch-none"
        >
          <div className="relative">
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
              <PinkyStage state={bubbleState} className="h-[4.6rem] w-[4rem]" />

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
