// Estado de la conversación y envío de mensajes.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@blackpink/types';
import { sendMessage, type ChatAction, type ChatCitation } from './chat-client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  streaming?: boolean;
  action?: ChatAction;
  citations?: ChatCitation[];
  blocked?: boolean;
  failed?: boolean;
}

const STORAGE_KEY = 'bp-chat-history';
const SESSION_KEY = 'bp-chat-session';

export function useChat(locale: Locale) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [restored, setRestored] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<string>('');

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
      sessionRef.current = crypto.randomUUID();
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      const stable = messages.filter((m) => !m.streaming);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stable.slice(-40)));
    } catch {
      /* sin almacenamiento, sin persistencia */
    }
  }, [messages, restored]);

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
