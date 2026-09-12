// Panel del chat: mensajes, campo de texto y voz.
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Locale } from '@blackpink/types';
import { SUPPORTED_LOCALES } from '@blackpink/types';
import {
  ClipIcon,
  CloseIcon,
  MicIcon,
  MicOffIcon,
  MinimizeIcon,
  SpeakerIcon,
  SpeakerOffIcon,
} from '@blackpink/ui';
import { usePathname, useRouter } from '../../i18n/routing';
import { ChatMessages } from './chat-messages';
import { PinkyStage } from './pinky/pinky-stage';
import { fetchSuggestions, transcribeAudio, TranscribeError } from './chat-client';
import { useRecorder } from './voice/use-recorder';
import { useSpeech } from './voice/use-speech';
import { VoiceRecorder } from './voice/voice-recorder';
import type { PinkyState } from './pinky/pinky-lion';
import { useChat } from './use-chat';

const MAX_AUDIO_SECONDS = 60;

function messageForCode(code: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    EMPTY_AUDIO: 'errEmptyAudio',
    UNSUPPORTED_FORMAT: 'errUnsupportedFormat',
    AUDIO_TOO_LARGE: 'errTooLarge',
    AUDIO_TOO_LONG: 'errTooLong',
    ASR_QUOTA: 'errQuota',
    SPEECH_RATE_LIMIT: 'errRateLimit',
  };
  return t(map[code] ?? 'errUnavailable');
}

export interface ChatPanelProps {
  onClose: () => void;
  onMinimize: () => void;
}

export function ChatPanel({ onClose, onMinimize }: ChatPanelProps) {
  const t = useTranslations('Chat');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion() ?? false;

  const { messages, sending, send, clear } = useChat(locale);
  const [draft, setDraft] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [waving, setWaving] = useState(true);

  const [transcribing, setTranscribing] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const transcribeInto = useCallback(
    (blob: Blob) => {
      setVoiceNotice(null);
      setTranscribing(true);

      void transcribeAudio(blob)
        .then((result) => {
          setDraft((previous) => (previous ? `${previous.trimEnd()} ${result.text}` : result.text));
          setVoiceNotice(t('transcribeReview'));
          inputRef.current?.focus();
        })
        .catch((error: unknown) => {
          setVoiceNotice(
            error instanceof TranscribeError ? messageForCode(error.code, t) : t('errUnavailable'),
          );
        })
        .finally(() => setTranscribing(false));
    },
    [t],
  );

  const recorder = useRecorder({ maxSeconds: MAX_AUDIO_SECONDS, onComplete: transcribeInto });
  const voice = useSpeech();

  const spokenRef = useRef<string | null>(null);

  useEffect(() => {
    const reply = messages.at(-1);
    if (!reply || reply.role !== 'model' || reply.streaming) return;
    if (spokenRef.current === reply.id) return;

    spokenRef.current = reply.id;
    voice.speak(reply.text, locale);
  }, [messages, voice, locale]);

  useEffect(() => {
    if (sending) voice.stop();
  }, [sending, voice]);

  useEffect(() => {
    if (recorder.state === 'denied') setVoiceNotice(t('micDenied'));
    else if (recorder.state === 'unsupported') setVoiceNotice(t('micUnsupported'));
    else if (recorder.state === 'error') setVoiceNotice(t('micError'));
  }, [recorder.state, t]);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const recording = recorder.state === 'recording' || recorder.state === 'requesting';
  const micBlocked = recorder.state === 'denied' || recorder.state === 'unsupported';
  const micAvailable = !micBlocked;
  const last = messages.at(-1);
  const pinkyState: PinkyState = sending
    ? last?.text
      ? 'speaking'
      : 'thinking'
    : voice.speaking
      ? 'speaking'
      : transcribing
        ? 'thinking'
        : recording
          ? 'listening'
          : waving
            ? 'greeting'
            : typing
              ? 'listening'
              : 'idle';

  useEffect(() => {
    const timer = setTimeout(() => setWaving(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    void fetchSuggestions(locale).then(setSuggestions);
  }, [locale]);

  useEffect(() => {
    inputRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        window.speechSynthesis?.cancel();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0]!;
      const last_ = focusables[focusables.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last_.focus();
      } else if (!event.shiftKey && document.activeElement === last_) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function submit(text: string) {
    const value = text.trim();
    if (!value) return;
    setDraft('');
    void send(value);
  }

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={t('title')}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
      transition={{
        duration: reduced ? 0.12 : 0.26,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={[
        'bg-canvas border-line flex flex-col overflow-hidden border shadow-[var(--shadow-lift-2)]',
        'fixed inset-0 z-[85] rounded-none',
        'sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(34rem,80vh)] sm:w-[23rem] sm:rounded-md',
      ].join(' ')}
    >
      <header className="border-line flex items-center gap-1.5 border-b px-3 py-2.5 sm:gap-2 sm:px-4">
        <div className="h-14 w-12 shrink-0">
          <PinkyStage state={pinkyState} className="h-full w-full" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-fg text-base font-bold leading-tight">PINKY</p>
          <p className="text-fg-subtle text-2xs truncate tracking-normal">{t('subtitle')}</p>
        </div>

        <label className="sr-only" htmlFor="chat-locale">
          {t('language')}
        </label>
        <select
          id="chat-locale"
          value={locale}
          onChange={(event) => router.replace(pathname, { locale: event.target.value as Locale })}
          className="border-line text-fg-muted focus-visible:outline-focus shrink-0 rounded-sm border bg-transparent px-1 py-1 text-xs focus-visible:outline-2"
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code} className="bg-canvas">
              {code.toUpperCase()}
            </option>
          ))}
        </select>

        {voice.supported ? (
          <button
            type="button"
            onClick={voice.toggle}
            aria-pressed={voice.enabled}
            aria-label={voice.enabled ? t('voiceOff') : t('voiceOn')}
            title={voice.enabled ? t('voiceOff') : t('voiceOn')}
            className={[
              'focus-visible:outline-focus ease-out-soft grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors duration-[var(--dur-2)] focus-visible:outline-2',
              voice.enabled ? 'text-accent-text' : 'text-fg-muted hover:text-fg',
            ].join(' ')}
          >
            {voice.enabled ? (
              <SpeakerIcon className="text-base" />
            ) : (
              <SpeakerOffIcon className="text-base" />
            )}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onMinimize}
          aria-label={t('minimize')}
          className="text-fg-muted hover:text-fg focus-visible:outline-focus ease-out-soft grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors duration-[var(--dur-2)] focus-visible:outline-2"
        >
          <MinimizeIcon className="text-base" />
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="text-fg-muted hover:text-fg focus-visible:outline-focus ease-out-soft grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors duration-[var(--dur-2)] focus-visible:outline-2"
        >
          <CloseIcon className="text-base" />
        </button>
      </header>

      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-end px-4 py-4">
          <p className="text-fg-muted text-pretty text-sm">{t('welcome')}</p>
        </div>
      ) : (
        <ChatMessages messages={messages} sending={sending} />
      )}

      {messages.length === 0 && suggestions.length > 0 ? (
        <div className="border-line flex flex-wrap gap-2 border-t px-4 py-3">
          {suggestions.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className="border-line text-fg-muted hover:border-accent hover:text-accent-text focus-visible:outline-focus ease-out-bp rounded-full border px-3 py-1.5 text-xs transition-colors duration-[var(--dur-2)] focus-visible:outline-2 active:scale-[0.97]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
        className="border-line border-t px-3 py-3"
      >
        {recording ? (
          <VoiceRecorder
            elapsed={recorder.elapsed}
            maxSeconds={MAX_AUDIO_SECONDS}
            levels={recorder.levels}
            onCancel={recorder.cancel}
            onStop={recorder.stop}
          />
        ) : (
          <div className="flex items-end gap-2">
            <label className="sr-only" htmlFor="chat-input">
              {t('inputLabel')}
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 1000))}
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit(draft);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder={t('placeholder')}
              className="border-line text-fg placeholder:text-fg-subtle focus-visible:outline-focus max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-sm border bg-transparent px-3 py-2 text-sm focus-visible:outline-2"
            />

            {draft.trim().length === 0 ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*,.webm,.ogg,.wav,.mp3,.m4a"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) transcribeInto(file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={transcribing}
                  aria-label={t('recordAttach')}
                  title={t('recordAttach')}
                  className="text-fg-muted hover:text-fg focus-visible:outline-focus ease-out-soft grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-[var(--dur-2)] focus-visible:outline-2 disabled:opacity-40"
                >
                  <ClipIcon className="text-base" />
                </button>

                <button
                  type="button"
                  onClick={() => void recorder.start()}
                  disabled={transcribing || micBlocked}
                  aria-label={t('recordStart')}
                  title={t('recordStart')}
                  className="text-fg-muted hover:text-accent-text focus-visible:outline-focus ease-out-bp grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-[var(--dur-2)] focus-visible:outline-2 active:scale-[0.94] disabled:opacity-40"
                >
                  {micBlocked ? (
                    <MicOffIcon className="text-base" />
                  ) : (
                    <MicIcon className="text-base" />
                  )}
                </button>
              </>
            ) : null}

            {draft.trim().length > 0 ? (
              <button
                type="submit"
                disabled={sending || transcribing}
                className="bg-accent text-accent-fg focus-visible:outline-focus ease-out-bp h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-[background-color,transform] duration-[var(--dur-2)] focus-visible:outline-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('send')}
              </button>
            ) : null}
          </div>
        )}

        {transcribing || voiceNotice ? (
          <p
            role="status"
            className={[
              'text-2xs mt-2 text-pretty leading-relaxed',
              transcribing ? 'text-fg-muted' : 'text-accent-text',
            ].join(' ')}
          >
            {transcribing ? t('transcribing') : voiceNotice}
          </p>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-fg-subtle text-2xs">
            {t('disclaimer')}
            {micAvailable ? ` ${t('audioPrivacy')}` : ''}
          </p>

          {messages.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="text-fg-subtle hover:text-accent-text focus-visible:outline-focus text-2xs shrink-0 underline underline-offset-4 focus-visible:outline-2"
            >
              {t('clear')}
            </button>
          ) : null}
        </div>
      </form>
    </motion.div>
  );
}
