// Juego del quiz: preguntas, reloj, puntuación y compartir.
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { Locale, QuizDifficulty, QuizQuestion } from '@blackpink/types';
import { Button, EmptyState, FilterBar } from '@blackpink/ui';
import { gradeAnswer, type GradeResult } from '../../app/[locale]/quiz/actions';
import { QuizBar } from './quiz-bar';
import { QuizResult } from './quiz-result';

const TIME_PER_QUESTION = 20;
const NEAR_LIMIT = 5;
const ROUND_SIZE = 10;

type Phase = 'idle' | 'asking' | 'revealed' | 'done';

export interface QuizGameProps {
  questions: QuizQuestion[];
  locale: Locale;
  labels: Record<string, string>;
  counts: Record<string, number>;
}

const DIFFICULTIES: QuizDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function QuizGame({ questions, locale, labels, counts }: QuizGameProps) {
  const reduceMotion = useReducedMotion();

  const [difficulty, setDifficulty] = useState<string>('all');
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [remaining, setRemaining] = useState(TIME_PER_QUESTION);
  const [shared, setShared] = useState(false);

  const pool = useMemo(
    () => (difficulty === 'all' ? questions : questions.filter((q) => q.difficulty === difficulty)),
    [questions, difficulty],
  );

  const current = round[index];
  const isLast = index === round.length - 1;

  const reveal = useCallback(
    async (chosen: number | null) => {
      if (!current) return;
      setChoice(chosen);
      setPhase('revealed');

      const graded = await gradeAnswer(current.id, chosen, locale);
      setResult(graded);
      if (graded?.correct) setScore((value) => value + 1);
    },
    [current, locale],
  );

  const startedAt = useRef<number>(0);

  useEffect(() => {
    if (phase !== 'asking') return;

    startedAt.current = Date.now();
    setRemaining(TIME_PER_QUESTION);

    const tick = () => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const left = Math.max(0, TIME_PER_QUESTION - elapsed);
      setRemaining(left);
      if (left <= 0) void reveal(null);
    };

    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, index, reveal]);

  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== 'asking' || index !== 0) return;
    boardRef.current?.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [phase, index, reduceMotion]);

  function start() {
    setRound(shuffle(pool).slice(0, ROUND_SIZE));
    setIndex(0);
    setScore(0);
    setChoice(null);
    setResult(null);
    setShared(false);
    setPhase('asking');
  }

  function next() {
    if (isLast) {
      setPhase('done');
      return;
    }
    setIndex((value) => value + 1);
    setChoice(null);
    setResult(null);
    setPhase('asking');
  }

  async function share() {
    const url = new URL(window.location.href);
    url.searchParams.set('score', String(score));
    url.searchParams.set('total', String(round.length));
    const text = fill(labels.shareText!, { score, total: round.length });

    if (navigator.share) {
      try {
        await navigator.share({ title: labels.title, text, url: url.toString() });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url.toString()}`);
      setShared(true);
      window.setTimeout(() => setShared(false), 2400);
    } catch {
      /* Portapapeles denegado */
    }
  }

  const filterOptions = [
    { value: 'all', label: labels.all!, count: questions.length },
    ...DIFFICULTIES.map((value) => ({
      value,
      label: labels[value]!,
      count: counts[value] ?? 0,
    })),
  ].filter((option) => option.value === 'all' || option.count > 0);

  if (phase === 'idle' || phase === 'done') {
    return (
      <div>
        <FilterBar
          label={labels.difficulty!}
          options={filterOptions}
          value={difficulty}
          onChange={(value) => {
            setDifficulty(value);
            setPhase('idle');
          }}
        />

        {phase === 'done' ? (
          <QuizResult
            score={score}
            total={round.length}
            labels={labels}
            shared={shared}
            onRetry={start}
            onShare={share}
            reduceMotion={Boolean(reduceMotion)}
          />
        ) : pool.length === 0 ? (
          <div className="mt-block">
            <EmptyState title={labels.empty!} description={labels.description!} />
          </div>
        ) : (
          <div className="mt-block border-line pt-block border-t">
            <p data-numeric className="text-fg-muted text-pretty">
              {fill(labels.rules!, {
                count: Math.min(ROUND_SIZE, pool.length),
                seconds: TIME_PER_QUESTION,
              })}
            </p>
            <Button className="mt-6" onClick={start}>
              {labels.start}
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!current) return null;

  const answered = phase === 'revealed';
  const pending = answered && !result;
  const nearLimit = remaining <= NEAR_LIMIT;

  return (
    <div ref={boardRef} className="mt-block scroll-mt-24">
      <div className="flex items-baseline justify-between gap-4">
        <p data-numeric className="text-fg-subtle text-2xs" data-uppercase>
          {fill(labels.progress!, { current: index + 1, total: round.length })}
        </p>
        {answered ? null : (
          <p
            data-numeric
            className={
              nearLimit ? 'text-accent-text text-2xs font-medium' : 'text-fg-subtle text-2xs'
            }
            aria-live={nearLimit ? 'assertive' : 'off'}
          >
            {fill(labels.timeLeft!, { seconds: Math.ceil(remaining) })}
          </p>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <QuizBar value={(index + (answered ? 1 : 0)) / round.length} tone="line" />
        <QuizBar
          value={answered ? 0 : remaining / TIME_PER_QUESTION}
          tone="accent"
          instant={!answered}
        />
      </div>

      <h2 className="font-display text-fg mt-block text-balance text-2xl font-bold sm:text-3xl">
        {current.question}
      </h2>

      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {current.options.map((option, optionIndex) => {
          const isChoice = choice === optionIndex;
          const isAnswer = result?.correctIndex === optionIndex;

          return (
            <li key={optionIndex}>
              <button
                type="button"
                disabled={answered}
                onClick={() => void reveal(optionIndex)}
                aria-label={option}
                className={[
                  'rounded-xs border-line w-full border px-4 py-3.5 text-left text-base',
                  'ease-out-soft transition-colors duration-[var(--dur-2)]',
                  'focus-visible:outline-focus focus-visible:outline-2 focus-visible:outline-offset-2',
                  'disabled:cursor-default',
                  !answered && 'hover:border-accent hover:text-accent-text active:scale-[0.99]',
                  pending && isChoice && 'border-fg-subtle text-fg',
                  pending && !isChoice && 'text-fg-subtle opacity-60',
                  !pending &&
                    answered &&
                    isAnswer &&
                    'border-accent text-accent-text bp-quiz-right',
                  !pending &&
                    answered &&
                    isChoice &&
                    !isAnswer &&
                    'border-line text-fg-muted bp-quiz-wrong line-through decoration-1',
                  !pending &&
                    answered &&
                    !isAnswer &&
                    !isChoice &&
                    'text-fg-subtle border-transparent opacity-60',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="mt-6 min-h-[4.5rem]">
        {answered && result ? (
          <div className={reduceMotion ? undefined : 'bp-quiz-verdict'}>
            <p
              className={
                result.correct
                  ? 'text-accent-text text-2xs font-medium'
                  : 'text-fg-muted text-2xs font-medium'
              }
              data-uppercase
            >
              {choice === null ? labels.timeUp : result.correct ? labels.correct : labels.incorrect}
            </p>

            {!result.correct ? (
              <p className="text-fg mt-2 text-pretty">
                {fill(labels.wasAnswer!, { answer: current.options[result.correctIndex] ?? '' })}
              </p>
            ) : null}

            {result.explanation ? (
              <p className="text-fg-muted mt-2 max-w-prose text-pretty text-sm">
                {result.explanation}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-fg-subtle text-sm">{labels.answering}</p>
        )}
      </div>

      {answered ? (
        <Button className="mt-2" onClick={next}>
          {isLast ? labels.seeResult : labels.next}
        </Button>
      ) : null}
    </div>
  );
}
