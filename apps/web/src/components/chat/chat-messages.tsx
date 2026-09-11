'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link } from '../../i18n/routing';
import { parseRichText } from './rich-text';
import type { Span } from './rich-text';
import type { ChatMessage } from './use-chat';

/**
 * ============================================================================
 * LA CONVERSACION
 * ============================================================================
 * Tres decisiones que no son cosmeticas:
 *
 * 1. `aria-live="polite"` en la lista, no en cada burbuja. Anunciar cada token
 *    del stream convertiria un lector de pantalla en una ametralladora. Con la
 *    region viva en el contenedor, el lector lee cuando el texto se estabiliza.
 *
 * 2. La burbuja bloqueada NO se disfraza de respuesta normal. Lleva su propio
 *    filete y su tono apagado: el visitante tiene derecho a saber que ahi paso
 *    algo, no solo a ver un texto distinto del que estaba leyendo.
 *
 * 3. El autoscroll respeta al que sube. Si alguien esta leyendo hacia arriba y
 *    el bot sigue escribiendo, arrastrarle al final es quitarle el control de
 *    su propia pantalla.
 * ============================================================================
 */

/**
 * El texto de una respuesta, con el poco markdown que escribe el modelo ya
 * resuelto. El analisis vive en `rich-text.ts` porque es una funcion pura y se
 * prueba sola; aqui solo queda ponerle etiquetas.
 *
 * Los parrafos son `span` en modo bloque y no `<p>`: la burbuja mete despues
 * las citas y el boton de accion, y un `<p>` cerraria el flujo antes de tiempo.
 */
function Rich({
  text,
  streaming,
  trailing,
}: {
  text: string;
  streaming: boolean;
  trailing?: ReactNode;
}) {
  // Se reanaliza con cada token que llega -son cadenas cortas- pero el memo
  // evita rehacerlo cuando lo que ha cambiado es otro mensaje de la lista.
  const blocks = useMemo(() => parseRichText(text, streaming), [text, streaming]);

  const nodes: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    if (blocks[i]!.type === 'li') {
      // Los elementos seguidos se agrupan en una sola lista.
      const items: ReactNode[] = [];
      const from = i;
      while (i < blocks.length && blocks[i]!.type === 'li') {
        const item = blocks[i]!;
        items.push(
          <li key={i} className="flex gap-2">
            <span className="text-fg-subtle shrink-0 tabular-nums" aria-hidden>
              {item.marker ?? '•'}
            </span>
            <span>{item.spans.map(renderSpan)}</span>
          </li>,
        );
        i += 1;
      }
      i -= 1;
      nodes.push(
        <ul key={`ul-${from}`} className="mt-2 flex flex-col gap-1 first:mt-0">
          {items}
        </ul>,
      );
      continue;
    }

    nodes.push(
      <span key={i} className="mt-2 block first:mt-0">
        {blocks[i]!.spans.map(renderSpan)}
        {i === blocks.length - 1 ? trailing : null}
      </span>,
    );
  }

  // Si el ultimo bloque fue una lista, el cursor no cabe dentro y va detras.
  const lastIsList = blocks.length > 0 && blocks[blocks.length - 1]!.type === 'li';

  return (
    <>
      {nodes}
      {lastIsList || blocks.length === 0 ? trailing : null}
    </>
  );
}

function renderSpan(span: Span, index: number) {
  let node: ReactNode = span.text;
  if (span.code) {
    node = <code className="bg-canvas rounded-sm px-1 py-0.5 text-[0.9em]">{node}</code>;
  }
  if (span.em) node = <em>{node}</em>;
  if (span.strong) node = <strong className="font-semibold">{node}</strong>;
  return <Fragment key={index}>{node}</Fragment>;
}

export interface ChatMessagesProps {
  messages: ChatMessage[];
  sending: boolean;
}

export function ChatMessages({ messages, sending }: ChatMessagesProps) {
  const t = useTranslations('Chat');
  const reduced = useReducedMotion() ?? false;
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
      // 80px de margen: quien esta "casi abajo" sigue queriendo seguir el hilo.
      stickToBottom.current = distance < 80;
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) return;
    endRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'end' });
  }, [messages, reduced]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      // La region viva va aqui: una sola, no una por mensaje.
      aria-live="polite"
      aria-relevant="additions text"
    >
      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {/*
            La burbuja del asistente NO se pinta mientras esta vacia. El
            mensaje se crea en cuanto se envia, con el texto por rellenar, y
            durante ese hueco se dibujaba una pastilla vacia JUSTO ENCIMA de
            los tres puntos: dos elementos para un solo estado.
          */}
          {messages
            .filter((message) => !(message.streaming && message.text.length === 0))
            .map((message) => (
              <motion.li
                key={message.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                // Entrada corta: una burbuja de chat aparece decenas de veces por
                // conversacion y cualquier cosa mas larga se vuelve pesada.
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                // Quien habla, como dato y no como clase: los e2e lo leen, y
                // una clase de maquetado cambia el dia que cambia el diseño.
                data-role={message.role}
                className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={[
                    'max-w-[85%] text-pretty rounded-lg px-3.5 py-2.5 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-accent text-accent-fg'
                      : message.blocked
                        ? 'border-line text-fg-muted border border-dashed'
                        : message.failed
                          ? 'border-line text-fg-subtle border'
                          : 'bg-overlay text-fg',
                  ].join(' ')}
                >
                  {/* Lo que escribe el visitante se pinta TAL CUAL. Analizar
                      su markdown seria interpretar lo que ha tecleado: quien
                      escribe un asterisco quiere ver un asterisco. */}
                  {message.role === 'user' ? (
                    message.text
                  ) : (
                    <Rich
                      text={message.text}
                      streaming={message.streaming === true}
                      trailing={
                        /* El cursor va DENTRO del ultimo bloque: colgado
                           detras se iba a una linea propia en cuanto la
                           respuesta tenia mas de un parrafo. */
                        message.streaming && message.text.length > 0 ? (
                          <span className="bg-accent ml-0.5 inline-block h-3.5 w-[2px] align-middle" />
                        ) : null
                      }
                    />
                  )}

                  {message.citations && message.citations.length > 0 ? (
                    <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      {message.citations.map((cite) => (
                        <Link
                          key={cite.path}
                          href={cite.path}
                          className="text-fg-subtle hover:text-accent-text text-2xs underline underline-offset-4"
                        >
                          {cite.label}
                        </Link>
                      ))}
                    </span>
                  ) : null}

                  {/* La accion de navegacion, ya validada por el servicio. */}
                  {message.action && message.action.action !== 'none' && message.action.path ? (
                    <Link
                      href={message.action.path}
                      className="border-line hover:border-accent hover:text-accent-text ease-out-bp mt-3 inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors duration-[var(--dur-2)]"
                    >
                      {message.action.label ?? t('go')}
                    </Link>
                  ) : null}
                </div>
              </motion.li>
            ))}
        </AnimatePresence>

        {/* Tres puntos solo ANTES del primer token: en cuanto hay texto, el
            texto mismo dice que esta escribiendo. */}
        {sending && messages.at(-1)?.text === '' ? (
          <li className="flex justify-start">
            <span
              className="bg-overlay flex items-center gap-1 rounded-lg px-3.5 py-3"
              aria-label={t('typing')}
              role="status"
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className="bp-typing-dot" data-dot={i} />
              ))}
            </span>
          </li>
        ) : null}
      </ul>

      <div ref={endRef} />
    </div>
  );
}
