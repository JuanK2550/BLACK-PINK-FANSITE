// Pantalla final del quiz: puntuación, veredicto y compartir.

'use client';

import { Button } from '@blackpink/ui';

export function QuizResult({
  score,
  total,
  labels,
  shared,
  onRetry,
  onShare,
  reduceMotion,
}: {
  score: number;
  total: number;
  labels: Record<string, string>;
  shared: boolean;
  onRetry: () => void;
  onShare: () => void;
  reduceMotion: boolean;
}) {
  const ratio = total > 0 ? score / total : 0;
  const verdict =
    ratio >= 0.8 ? labels.verdictHigh : ratio >= 0.5 ? labels.verdictMid : labels.verdictLow;

  return (
    <div className="mt-block border-line pt-block border-t">
      <p className="text-fg-subtle text-2xs" data-uppercase>
        {labels.resultTitle}
      </p>

      <p
        data-numeric
        className={[
          'font-display mt-3 text-6xl font-extrabold',
          reduceMotion ? '' : 'bp-quiz-score',
        ].join(' ')}
      >
        <span className="text-accent-text">{score}</span>
        <span className="text-fg-subtle"> / {total}</span>
      </p>

      <p className="text-fg-muted mt-4 max-w-prose text-pretty text-lg">{verdict}</p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button onClick={onRetry}>{labels.retry}</Button>
        <Button variant="secondary" onClick={onShare}>
          {labels.share}
        </Button>
        <span aria-live="polite" className="text-fg-subtle text-sm">
          {shared ? labels.shareCopied : ''}
        </span>
      </div>
    </div>
  );
}
