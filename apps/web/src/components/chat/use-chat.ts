'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@blackpink/types';
import { sendMessage, type ChatAction, type ChatCitation } from './chat-client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  /** true mientras el texto sigue llegando. */
  streaming?: boolean;
  action?: ChatAction;
  citations?: ChatCitation[];
  /** Marca visual: esta respuesta la corto el filtro de salida. */
  blocked?: boolean;
  /** Marca visual: fallo de red o de cuota. */
  failed?: boolean;
}

const STORAGE_KEY = 'bp-chat-history';
const SESSION_KEY = 'bp-chat-session';

/**
 * ============================================================================
 * ESTADO DE LA CONVERSACION
 * ============================================================================
 * Vive en `sessionStorage`, no en `localStorage`: una conversacion pertenece a
 * la visita. Guardarla para siempre significaria que alguien que pregunto algo
 * en un ordenador compartido se lo encuentra ahi una semana despues.
 *
 * El `sessionId` es un valor opaco que genera el navegador. NO identifica a
 * nadie: el servicio solo lo usa para contar mensajes y lo guarda en el log
 * como huella, nunca en claro.
 * ============================================================================
 */
export function useChat(locale: Locale) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [restored, setRestored] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<string>('');

  /* --------------------------------------------------------- persistencia */

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as ChatMessage[]);

      let id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(SESSION_KEY, id);
      }
      sessionRef.current = id;
    } catch {
      // Navegacion privada o almacenamiento bloqueado: el chat funciona
      // igual, solo que sin memoria entre recargas.
      sessionRef.current = crypto.randomUUID();
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      // No se guarda un mensaje a medio llegar: al recargar quedaria una
      // respuesta cortada con aspecto de completa.
      const stable = messages.filter((m) => !m.streaming);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stable.slice(-40)));
    } catch {
      /* sin almacenamiento, sin persistencia */
    }
  }, [messages, restored]);

  /* ------------------------------------------------------------- acciones */

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim().slice(0, 1000);
      if (!clean || sending) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: clean };
      const replyId = crypto.randomUUID();

      const history = messages
        .filter((m) => !m.blocked && !m.failed)
        .map((m) => ({ role: m.role, text: m.text }));

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: replyId, role: 'model', text: '', streaming: true },
      ]);
      setSending(true);

      const patch = (change: Partial<ChatMessage>) => {
        setMessages((prev) => prev.map((m) => (m.id === replyId ? { ...m, ...change } : m)));
      };

      try {
        for await (const event of sendMessage({
          message: clean,
          sessionId: sessionRef.current,
          locale,
          history,
          signal: controller.signal,
        })) {
          if (event.type === 'token') {
            setMessages((prev) =>
              prev.map((m) => (m.id === replyId ? { ...m, text: m.text + event.text } : m)),
            );
          }

          /*
           * CONTRATO DE LA FASE 9.
           *
           * `blocked` REEMPLAZA el texto acumulado, no lo continua. El
           * servidor corto la respuesta a mitad porque su filtro de salida
           * detecto algo, y lo que ya se habia pintado es justo lo que no
           * debe quedarse en pantalla. Concatenar aqui dejaria visible el
           * fragmento que el servicio decidio retirar.
           */
          if (event.type === 'blocked') {
            patch({ text: event.text, streaming: false, blocked: true });
            break;
          }

          if (event.type === 'done') {
            patch({ streaming: false, action: event.action, citations: event.citations });
          }

          if (event.type === 'error') {
            patch({ text: event.message, streaming: false, failed: true });
            break;
          }
        }
      } catch {
        if (!controller.signal.aborted) patch({ streaming: false, failed: true });
      } finally {
        patch({ streaming: false });
        setSending(false);
      }
    },
    [locale, messages, sending],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada que limpiar */
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, sending, send, clear, restored };
}
