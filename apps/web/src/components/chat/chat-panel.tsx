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
import { PinkyStage } from './pinky-stage';
import { fetchSuggestions, transcribeAudio, TranscribeError } from './chat-client';
import { useRecorder } from './use-recorder';
import { useSpeech } from './use-speech';
import { VoiceRecorder } from './voice-recorder';
import type { PinkyState } from './pinky-avatar';
import { useChat } from './use-chat';

/**
 * ============================================================================
 * PANEL DE CONVERSACION
 * ============================================================================
 * En movil ocupa la pantalla; en escritorio es una columna anclada abajo a la
 * derecha. No es la misma pieza estirada: en movil un panel flotante de 380px
 * deja la mitad de la pantalla inutil y el teclado virtual se come el resto.
 *
 * TRAMPA DE FOCO Y ESC: el panel se comporta como un dialogo, porque lo es.
 * Sin eso, tabular desde el campo de texto lleva al contenido de la pagina que
 * hay debajo, y quien navega con teclado se pierde.
 * ============================================================================
 */

/** El mismo limite que aplica el servidor. Aqui evita mandar lo que se va a
 *  rechazar; alla evita que alguien se salte el navegador. Los dos hacen falta. */
const MAX_AUDIO_SECONDS = 60;

/**
 * Del codigo del servidor al texto en el idioma de quien mira.
 *
 * Se ramifica por CODIGO y nunca por el mensaje: el mensaje del servicio esta
 * en castellano y la interfaz habla tres idiomas.
 */
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
  /** Ruta a un modelo .glb propio, si lo hay. */
  modelUrl?: string;
}

export function ChatPanel({ onClose, onMinimize, modelUrl }: ChatPanelProps) {
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

  /* ------------------------------------------------------------------- voz */

  const [transcribing, setTranscribing] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * El texto transcrito NO se envia solo: cae en el campo de entrada para que
   * la persona lo lea y lo corrija.
   *
   * No es cortesia. Whisper inventa frases enteras sobre el ruido de fondo, y
   * mandar directamente lo que ha oido convertiria un carraspeo en una
   * pregunta que nadie hizo. Ademas es la unica forma de que un dictado con un
   * nombre mal entendido se pueda arreglar antes de gastar una respuesta.
   */
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

  /*
   * Se lee la respuesta CUANDO TERMINA, no segun llega.
   *
   * Leer cada token obligaria a encolar decenas de fragmentos y sonaria
   * troceado; y sobre todo, el contrato `blocked` de la Fase 9 puede REEMPLAZAR
   * todo lo pintado a mitad de respuesta. Si la voz fuese por delante, ya
   * habria leido en alto justo el fragmento que el servidor retiro.
   *
   * `id` en las dependencias y no el texto: sin el, cada token entrante
   * volveria a disparar la lectura.
   */
  const spokenRef = useRef<string | null>(null);

  useEffect(() => {
    const reply = messages.at(-1);
    if (!reply || reply.role !== 'model' || reply.streaming) return;
    if (spokenRef.current === reply.id) return;

    spokenRef.current = reply.id;
    // Una respuesta bloqueada TAMBIEN se lee: el texto que queda en pantalla
    // es la negativa, y callarsela dejaria a quien usa la voz sin saber que
    // ha pasado.
    voice.speak(reply.text, locale);
  }, [messages, voice, locale]);

  // Al mandar otro mensaje, la voz se calla al instante. Que siga leyendo la
  // respuesta anterior mientras llega la siguiente es de sitio embrujado.
  useEffect(() => {
    if (sending) voice.stop();
  }, [sending, voice]);

  // Los estados de fallo del microfono se explican en el mismo sitio que el
  // resto de avisos, en vez de en un dialogo aparte.
  useEffect(() => {
    if (recorder.state === 'denied') setVoiceNotice(t('micDenied'));
    else if (recorder.state === 'unsupported') setVoiceNotice(t('micUnsupported'));
    else if (recorder.state === 'error') setVoiceNotice(t('micError'));
  }, [recorder.state, t]);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ------------------------------------------------------------ estado 3D */

  const recording = recorder.state === 'recording' || recorder.state === 'requesting';
  // Denegado o sin soporte: el boton se queda tachado y desactivado, pero el
  // chat sigue funcionando entero por teclado. Un permiso denegado no rompe
  // nada, solo quita una via de entrada.
  const micBlocked = recorder.state === 'denied' || recorder.state === 'unsupported';
  const micAvailable = !micBlocked;
  const last = messages.at(-1);
  const pinkyState: PinkyState = sending
    ? last?.text
      ? 'speaking' // ya llega texto
      : 'thinking' // aun no
    : voice.speaking
      ? 'speaking' // esta leyendo la respuesta en alto
      : transcribing
        ? 'thinking' // el audio esta de camino
        : recording
          ? 'listening' // literalmente: el microfono esta abierto
          : waving
            ? 'greeting' // los primeros segundos del panel
            : typing
              ? 'listening' // el campo tiene el foco: alguien esta escribiendo
              : 'idle';

  /*
   * El saludo dura lo que dura, y despues PINKY se queda en reposo.
   *
   * Antes iba atado a `messages.length === 0`, y eso la dejaba saludando
   * indefinidamente ante un panel vacio: un personaje con la pata levantada
   * durante dos minutos no saluda, esta atascado.
   */
  useEffect(() => {
    const timer = setTimeout(() => setWaving(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  /* --------------------------------------------------------- sugerencias */

  useEffect(() => {
    void fetchSuggestions(locale).then(setSuggestions);
  }, [locale]);

  /* ------------------------------------------------------- foco y teclado */

  useEffect(() => {
    inputRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        // Escape calla a PINKY antes de cerrar: quien pulsa Escape quiere que
        // pare todo, no solo que desaparezca el panel.
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

      // Trampa de foco: sin esto, tabular sale del panel al contenido de
      // detras y el lector de pantalla se lleva al visitante de paseo.
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

  /* ---------------------------------------------------------------- envio */

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
        // Salida mas rapida que entrada: al cerrar, el visitante ya decidio.
        duration: reduced ? 0.12 : 0.26,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={[
        'bg-canvas border-line flex flex-col overflow-hidden border shadow-[var(--shadow-lift-2)]',
        /*
         * z-85 y no `auto`. En movil el panel es `inset-0`, y sin indice de
         * apilamiento propio la cabecera del sitio -que es `sticky z-70`- se
         * pintaba POR ENCIMA del panel: en medio de la conversacion aparecia
         * la barra con el logotipo, la lupa y el menu. En escritorio no se
         * veia porque el panel es una columna en la esquina que no llega a
         * cruzarse con la cabecera.
         *
         * La escala del sitio: cabecera 70, burbuja 75, panel 85, menu movil
         * 80, buscador 90, enlace de salto 100. El buscador queda por encima
         * a proposito: es un dialogo modal y manda sobre el chat.
         */
        'fixed inset-0 z-[85] rounded-none',
        'sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(34rem,80vh)] sm:w-[23rem] sm:rounded-md',
      ].join(' ')}
    >
      {/* ---------------------------------------------------------- cabecera */}
      <header className="border-line flex items-center gap-1.5 border-b px-3 py-2.5 sm:gap-2 sm:px-4">
        {/*
          3.5rem de alto, no 2.75, y la caja NO es cuadrada: lleva la
          proporcion del viewBox. La ardilla se pinta entera tambien aqui, y a
          la altura anterior el cuerpo era un borron de tres pixeles.
          Se probo a 4rem y a 375px de ancho la cabecera se quedaba sin sitio:
          el subtitulo se cortaba en "Guia ...". Esto es lo que cabe.
        */}
        <div className="h-14 w-12 shrink-0">
          <PinkyStage state={pinkyState} modelUrl={modelUrl} className="h-full w-full" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-fg text-base font-bold leading-tight">PINKY</p>
          {/* `tracking-normal` sobre `text-2xs`: la escala 2xs lleva 0.08em de
              interletraje porque esta pensada para etiquetas en mayusculas, y
              aqui es una frase. Esos 0.08em por caracter se comian veinte
              pixeles y dejaban el subtitulo en "Guia virtual del si...". */}
          <p className="text-fg-subtle text-2xs truncate tracking-normal">{t('subtitle')}</p>
        </div>

        {/* Selector de idioma: cambia la ruta, que es lo que manda en el
            sitio. No es un ajuste solo del chat. */}
        <label className="sr-only" htmlFor="chat-locale">
          {t('language')}
        </label>
        {/* `shrink-0` en el selector y en los botones, para que sea el bloque
            del texto -que ya trunca- el que ceda el ancho. Sin esto, con el
            boton de voz anadido, la cabecera repartia el recorte entre todos y
            el subtitulo se quedaba en "Guia virtual del si...". */}
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

        {/* La voz: APAGADA por defecto y se recuerda encendida. Una pagina
            que empieza a hablar sola interrumpe, delata lo que alguien lee si
            hay gente cerca, y en un movil es una emboscada. */}
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

      {/* ------------------------------------------------------- conversacion */}
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-end px-4 py-4">
          <p className="text-fg-muted text-pretty text-sm">{t('welcome')}</p>
        </div>
      ) : (
        <ChatMessages messages={messages} sending={sending} />
      )}

      {/* --------------------------------------------------------- sugerencias */}
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

      {/* --------------------------------------------------------------- pie */}
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
            {/* "Escuchando" tenia estado y no tenia disparador: existia en el
              codigo y no se veia nunca. Aqui es literal -el campo tiene el
              foco, alguien esta escribiendo- y PINKY se inclina a mirar. */}
            <textarea
              id="chat-input"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, 1000))}
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              onKeyDown={(event) => {
                // Enter envia, Shift+Enter salta de linea. Es lo que espera
                // cualquiera que haya usado un chat.
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

            {/* ----------------------------------------------------- voz --
                El microfono y el clip solo aparecen cuando NO hay nada
                escrito. Con texto en el campo lo que se quiere es enviarlo, y
                tres botones juntos en 23rem obligan a apuntar. */}
            {draft.trim().length === 0 ? (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  // El navegador filtra por extension; el servidor decide por
                  // los BYTES. Esto es comodidad, no validacion.
                  accept="audio/*,.webm,.ogg,.wav,.mp3,.m4a"
                  /*
                   * FUERA DEL ARBOL ACCESIBLE Y DEL ORDEN DE TABULACION. Con
                   * `sr-only` a secas era un campo SIN ETIQUETA que un lector
                   * de pantalla podia alcanzar -axe lo marco como critico en
                   * los e2e-. El control accesible es el boton del clip, que
                   * tiene nombre y abre este selector; el input es solo el
                   * mecanismo.
                   */
                  aria-hidden="true"
                  tabIndex={-1}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    // Se limpia para que elegir el MISMO fichero otra vez
                    // vuelva a disparar el evento.
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

            {/* El boton de enviar aparece CUANDO HAY ALGO QUE ENVIAR, y en su
                sitio esta el microfono. Es el intercambio que hace cualquier
                mensajeria, y aqui ademas resuelve un problema medido: con los
                tres botones a la vez, el campo se quedaba en 90px y el texto
                de ejemplo se partia en dos lineas cortadas.
                Quien escribe con teclado no pierde nada: Enter sigue enviando
                y el boton vuelve en cuanto hay una letra. */}
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

        {/* Estado de la transcripcion y avisos del microfono. `role="status"`
            para que un lector de pantalla lo anuncie sin robar el foco. */}
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
          {/* El aviso de que no es una persona va SIEMPRE visible, no en un
              tooltip: es la regla del proyecto sobre no fingir ser humana.
              Y mientras se puede grabar va tambien que el audio no se guarda:
              es una promesa sobre datos de una persona, y esas se hacen donde
              se ven, no en una politica de privacidad aparte. */}
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
