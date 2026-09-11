'use client';

import { useTranslations } from 'next-intl';
import { CloseIcon, ReturnIcon } from '@blackpink/ui';

/**
 * ============================================================================
 * LA BARRA DE GRABACION
 * ============================================================================
 * Sustituye al campo de texto mientras se graba, en lugar de aparecer encima.
 * Grabar es un modo, no un anadido: mientras dura, lo unico que se puede hacer
 * es cancelar o enviar, y ensenar a la vez un campo donde escribir invitaria a
 * hacer las dos cosas.
 *
 * LA ONDA ES LA SENAL REAL DEL MICROFONO, muestra a muestra. No es una
 * animacion decorativa que se mueve sola: si nadie habla, la onda es plana, y
 * eso es informacion util -dice que el microfono no esta cogiendo nada antes
 * de gastar una transcripcion en un silencio-.
 *
 * Es la diferencia con el visualizador que se retiro en la Fase 8B: aquel
 * fingia sobre un iframe de Spotify del que no se podia leer nada. Aqui hay
 * senal, y por eso se pinta.
 *
 * SE DIBUJA CON `div`, NO CON `canvas`. Son 48 barras que cambian de altura;
 * un canvas obligaria a redibujar a mano en cada fotograma y a duplicar la
 * logica para el tema claro. Con barras, el color lo pone el sistema de
 * diseno y la altura es una transicion de CSS.
 * ============================================================================
 */

/** Barras visibles. Menos de 40 se lee a ecualizador; mas, a ruido. */
const BARS = 48;

export interface VoiceRecorderProps {
  elapsed: number;
  maxSeconds: number;
  levels: number[];
  onCancel: () => void;
  onStop: () => void;
}

export function VoiceRecorder({
  elapsed,
  maxSeconds,
  levels,
  onCancel,
  onStop,
}: VoiceRecorderProps) {
  const t = useTranslations('Chat');

  const remaining = Math.max(0, maxSeconds - elapsed);
  // Aviso a falta de diez segundos: suficiente para terminar una frase.
  const nearLimit = remaining <= 10;

  // Se rellena por la izquierda para que la onda crezca hacia la derecha en
  // lugar de aparecer entera de golpe.
  const bars = [...Array<number>(Math.max(0, BARS - levels.length)).fill(0), ...levels].slice(
    -BARS,
  );

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onCancel}
        aria-label={t('recordCancel')}
        className="text-fg-muted hover:text-fg focus-visible:outline-focus ease-out-soft grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-[var(--dur-2)] focus-visible:outline-2"
      >
        <CloseIcon className="text-base" />
      </button>

      <div className="border-line bg-overlay flex min-w-0 flex-1 items-center gap-2.5 rounded-full border px-3 py-2">
        {/* El punto que late. Es lo que dice «esto esta grabando AHORA». */}
        <span className="bp-rec-dot bg-accent h-2 w-2 shrink-0 rounded-full" aria-hidden />

        <span
          className={[
            'shrink-0 text-xs tabular-nums',
            nearLimit ? 'text-accent-text font-medium' : 'text-fg-muted',
          ].join(' ')}
          // El tiempo se anuncia solo al acercarse al limite: leerlo cada
          // decima convertiria un lector de pantalla en un cronometro.
          aria-live={nearLimit ? 'polite' : 'off'}
        >
          {format(elapsed)}
          {nearLimit ? ` · ${Math.ceil(remaining)}s` : ''}
        </span>

        {/* La onda. `aria-hidden` porque el tiempo de al lado ya dice lo que
            hay que saber: una lista de 48 alturas no se puede leer en voz. */}
        <div className="flex h-6 min-w-0 flex-1 items-center gap-[2px] overflow-hidden" aria-hidden>
          {bars.map((level, index) => (
            <span
              key={index}
              className="bg-accent w-full shrink rounded-full"
              style={{
                // 2px de suelo: una barra de altura cero desaparece y deja un
                // hueco, y la fila entera se lee como rota en vez de callada.
                height: `${2 + level * 22}px`,
                opacity: 0.35 + level * 0.65,
              }}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onStop}
        aria-label={t('recordStop')}
        className="bg-accent text-accent-fg focus-visible:outline-focus ease-out-bp grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform duration-[var(--dur-2)] focus-visible:outline-2 active:scale-[0.97]"
      >
        <ReturnIcon className="text-base" />
      </button>
    </div>
  );
}

/** `0:07.4`. Con decima porque a 60 segundos se nota cuanto queda. */
function format(seconds: number): string {
  const whole = Math.floor(seconds);
  const tenths = Math.floor((seconds - whole) * 10);
  return `0:${String(whole).padStart(2, '0')}.${tenths}`;
}
