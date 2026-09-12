// Barra de grabación con onda y cronómetro.
'use client';

import { useTranslations } from 'next-intl';
import { CloseIcon, ReturnIcon } from '@blackpink/ui';

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
  const nearLimit = remaining <= 10;

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
        <span className="bp-rec-dot bg-accent h-2 w-2 shrink-0 rounded-full" aria-hidden />

        <span
          className={[
            'shrink-0 text-xs tabular-nums',
            nearLimit ? 'text-accent-text font-medium' : 'text-fg-muted',
          ].join(' ')}
          aria-live={nearLimit ? 'polite' : 'off'}
        >
          {format(elapsed)}
          {nearLimit ? ` · ${Math.ceil(remaining)}s` : ''}
        </span>

        <div className="flex h-6 min-w-0 flex-1 items-center gap-[2px] overflow-hidden" aria-hidden>
          {bars.map((level, index) => (
            <span
              key={index}
              className="bg-accent w-full shrink rounded-full"
              style={{
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

function format(seconds: number): string {
  const whole = Math.floor(seconds);
  const tenths = Math.floor((seconds - whole) * 10);
  return `0:${String(whole).padStart(2, '0')}.${tenths}`;
}
