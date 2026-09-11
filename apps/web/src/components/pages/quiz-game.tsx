'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { Locale, QuizDifficulty, QuizQuestion } from '@blackpink/types';
import { Button, EmptyState, FilterBar } from '@blackpink/ui';
import { gradeAnswer, type GradeResult } from '../../app/[locale]/quiz/actions';

/**
 * ============================================================================
 * EL QUIZ
 * ============================================================================
 * LAS RESPUESTAS NO ESTÁN AQUÍ. Este componente recibe enunciado y opciones y
 * nada más: la página las pide con `includeAnswers: false`. Al responder llama
 * a `gradeAnswer`, que corrige en el servidor y devuelve el veredicto. Ver la
 * nota larga en `app/[locale]/quiz/actions.ts`.
 *
 * EL RELOJ SE MIDE CON UNA MARCA DE TIEMPO, NO CONTANDO TICS. Es la misma
 * lección que el grabador de voz de la Fase 11 y los gestos de PINKY: un
 * `requestAnimationFrame` se para en seco cuando la pestaña deja de pintarse,
 * y un `setInterval` se ralentiza a un tic por segundo. Contando tics, cambiar
 * de pestaña congelaría el cronómetro y regalaría tiempo. Restando
 * `Date.now()` contra el instante de inicio, la cuenta es correcta aunque el
 * navegador nos despierte tarde: el intervalo solo decide cada cuánto se
 * repinta, no cuánto tiempo ha pasado.
 *
 * EL TIEMPO NO SE PAUSA al ocultar la pestaña, a propósito. Es un quiz con
 * reloj; pausarlo sería una invitación a mirar la respuesta en otra pestaña.
 *
 * LAS BARRAS SE ANIMAN CON `scaleX`, NUNCA CON `width`. Es la regla del
 * sistema y también la de rendimiento: `width` obliga a recalcular el
 * maquetado en cada fotograma; `transform` no toca ni el maquetado ni el
 * pintado.
 *
 * ACCESIBILIDAD:
 * - Las opciones son BOTONES, no un `radiogroup`. Un grupo de radio deja mover
 *   la selección sin confirmarla, y aquí pulsar ES responder: no hay vuelta
 *   atrás. Un botón dice eso; un radio miente.
 * - El veredicto y la explicación se anuncian en una sola región `aria-live`.
 * - El reloj NO se anuncia mientras corre —sería una ametralladora— y solo
 *   pasa a `assertive` en los últimos segundos, igual que el cronómetro del
 *   grabador de voz.
 * ============================================================================
 */

/** Segundos por pregunta. */
const TIME_PER_QUESTION = 20;
/** A partir de aquí el reloj se pinta en acento y se anuncia. */
const NEAR_LIMIT = 5;
/** Preguntas por partida. */
const ROUND_SIZE = 10;

type Phase = 'idle' | 'asking' | 'revealed' | 'done';

export interface QuizGameProps {
  questions: QuizQuestion[];
  locale: Locale;
  labels: Record<string, string>;
  /** Recuento por dificultad, para la barra de filtros. */
  counts: Record<string, number>;
}

const DIFFICULTIES: QuizDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

/** Sustituye `{clave}` por su valor. Las cadenas vienen de next-intl en crudo. */
function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

/**
 * Baraja una copia. Fisher-Yates.
 *
 * Se baraja EN EL CLIENTE y al empezar la partida, no en el servidor: así dos
 * partidas seguidas no repiten el mismo orden aunque la página venga de caché.
 */
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

  /* ---------------------------------------------------------- corregir --- */

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

  /* ------------------------------------------------------------ reloj --- */

  const startedAt = useRef<number>(0);

  useEffect(() => {
    if (phase !== 'asking') return;

    startedAt.current = Date.now();
    setRemaining(TIME_PER_QUESTION);

    const tick = () => {
      // El tiempo se DERIVA del reloj, no se descuenta. Un tic tardío no roba
      // segundos porque no es el tic quien los cuenta.
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const left = Math.max(0, TIME_PER_QUESTION - elapsed);
      setRemaining(left);
      if (left <= 0) void reveal(null);
    };

    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, index, reveal]);

  /* ---------------------------------------------------------- encuadre --- */

  const boardRef = useRef<HTMLDivElement>(null);

  /*
   * AL EMPEZAR LA PARTIDA, LA PREGUNTA SE TRAE A PANTALLA.
   *
   * En móvil, «Empezar» está al final de la cabecera de la página: al pulsarlo
   * el enunciado ocupa el sitio del botón y las opciones nacen POR DEBAJO del
   * borde inferior. Con un reloj de 20 segundos, pedir además que alguien se
   * desplace a mano es cobrarle tiempo por la interfaz.
   *
   * SOLO AL ARRANCAR (`index === 0`). Durante la partida la posición ya no
   * cambia, y desplazar en cada pregunta movería la página bajo los dedos de
   * quien ya está donde quiere estar.
   *
   * El desplazamiento suave se apaga con `prefers-reduced-motion`: el salto
   * instantáneo lleva al mismo sitio.
   */
  useEffect(() => {
    if (phase !== 'asking' || index !== 0) return;
    boardRef.current?.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [phase, index, reduceMotion]);

  /* ------------------------------------------------------------ juego --- */

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

  /* --------------------------------------------------------- compartir --- */

  async function share() {
    const url = new URL(window.location.href);
    url.searchParams.set('score', String(score));
    url.searchParams.set('total', String(round.length));
    const text = fill(labels.shareText!, { score, total: round.length });

    /*
     * DOS VIAS, Y LA SEGUNDA NO ES SOLO PARA CUANDO FALTA LA PRIMERA.
     *
     * `navigator.share` existe en móvil y TAMBIÉN en el Chrome de escritorio
     * —comprobado aquí, en Windows—, donde abre el panel del sistema. Pero
     * puede rechazar por motivos que no son «no existe»: sin activación del
     * usuario, sin aplicaciones con las que compartir, o con el permiso
     * denegado.
     *
     * Con un solo `try` alrededor de las dos vías, cualquiera de esos fallos
     * dejaba el botón MUDO: no comparte, no copia y no dice nada. Por eso el
     * portapapeles ya no cuelga de que `share` no exista, sino de que no haya
     * funcionado.
     *
     * Cancelar SÍ es un final válido, y se distingue: quien cierra el panel a
     * propósito no quiere que además le copiemos nada.
     */
    if (navigator.share) {
      try {
        await navigator.share({ title: labels.title, text, url: url.toString() });
        return;
      } catch (error) {
        // Cancelar es una decisión, no un fallo.
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url.toString()}`);
      setShared(true);
      window.setTimeout(() => setShared(false), 2400);
    } catch {
      // Portapapeles denegado. No hay tercera vía, y esto no merece
      // interrumpir a nadie con un aviso.
    }
  }

  /* ----------------------------------------------------------- filtros --- */

  const filterOptions = [
    { value: 'all', label: labels.all!, count: questions.length },
    ...DIFFICULTIES.map((value) => ({
      value,
      label: labels[value]!,
      count: counts[value] ?? 0,
    })),
  ].filter((option) => option.value === 'all' || option.count > 0);

  /* ------------------------------------------------------------ vistas --- */

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
          <Result
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
            {/*
             * Aqui van las REGLAS, no la descripcion: esta ya esta en la
             * cabecera de la pagina, y repetirla dos veces en la misma
             * pantalla no informa de nada. Cuantas preguntas y cuanto tiempo
             * si es algo que quien va a jugar necesita saber ANTES de empezar,
             * porque hay un reloj.
             */}
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
  /*
   * ESPERANDO VEREDICTO. Corregir es una ida y vuelta al servidor -entre 90 y
   * 400 ms- y en ese hueco todavia NO se sabe si la respuesta es buena.
   *
   * Sin este estado, la opcion elegida caia directamente en la rama de error y
   * durante esa fraccion de segundo una respuesta CORRECTA se veia tachada
   * antes de ponerse en acento. Se veia, y es justo el tipo de parpadeo que
   * hace dudar de si el sitio te ha entendido.
   *
   * Mientras se espera, la eleccion se marca como elegida y nada mas: ni
   * acierto ni fallo, que es exactamente lo que se sabe en ese momento.
   */
  const pending = answered && !result;
  const nearLimit = remaining <= NEAR_LIMIT;

  return (
    /* `scroll-mt-24` deja sitio a la cabecera fija: sin él, el encuadre mete
       el progreso justo debajo de la barra del logotipo y no se ve. */
    <div ref={boardRef} className="mt-block scroll-mt-24">
      {/* --- Progreso de la partida --------------------------------------- */}
      <div className="flex items-baseline justify-between gap-4">
        <p data-numeric className="text-fg-subtle text-2xs" data-uppercase>
          {fill(labels.progress!, { current: index + 1, total: round.length })}
        </p>
        {/*
         * EL RELOJ DESAPARECE AL RESPONDER, no se queda congelado.
         *
         * Al revelar, el intervalo se para: el numero se quedaba clavado en
         * los segundos que sobraban -«9 s» junto a una respuesta ya
         * corregida- y eso se lee como un reloj que sigue corriendo. Es la
         * misma regla que retiro la barra de reproduccion en la Fase 8B:
         * antes que ensenar un estado que no es el real, no se ensena.
         *
         * La barra de acento ya cae a cero al responder, asi que el hueco no
         * queda mudo: dice que el tiempo dejo de contar.
         */}
        {answered ? null : (
          <p
            data-numeric
            className={
              nearLimit ? 'text-accent-text text-2xs font-medium' : 'text-fg-subtle text-2xs'
            }
            /*
             * El reloj solo se anuncia cuando queda poco. Anunciarlo siempre
             * convertiría el lector de pantalla en un metrónomo y taparía el
             * enunciado, que es lo que hay que oír.
             */
            aria-live={nearLimit ? 'assertive' : 'off'}
          >
            {fill(labels.timeLeft!, { seconds: Math.ceil(remaining) })}
          </p>
        )}
      </div>

      {/* Dos barras de 1px, una encima de otra: la de la partida y la del
          reloj. Ambas con `scaleX`. */}
      <div className="mt-3 space-y-1">
        <Bar value={(index + (answered ? 1 : 0)) / round.length} tone="line" />
        <Bar
          value={answered ? 0 : remaining / TIME_PER_QUESTION}
          tone="accent"
          instant={!answered}
        />
      </div>

      {/* --- Enunciado ---------------------------------------------------- */}
      {/*
       * EL ENUNCIADO BAJA UN ESCALON EN MOVIL.
       *
       * A 375px, `text-3xl` partia una pregunta larga en CINCO lineas y
       * empujaba las cuatro opciones fuera de la pantalla: con el reloj
       * corriendo, lo primero que hacia falta era desplazarse. Un escalon
       * menos las deja a la vista sin quitarle al enunciado su papel de
       * titular, que en escritorio se conserva entero.
       */}
      <h2 className="font-display text-fg mt-block text-balance text-2xl font-bold sm:text-3xl">
        {current.question}
      </h2>

      {/* --- Opciones ----------------------------------------------------- */}
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
                  /*
                   * Al revelar hay TRES estados, no dos, y los tres tienen que
                   * distinguirse: la correcta, la que elegiste si fallaste, y
                   * las que no tocaste.
                   *
                   * Al principio la elegida y las no elegidas solo se
                   * separaban por un 55% de opacidad, y en pantalla eso no se
                   * ve: al fallar no sabias cual habias marcado. Ahora tu
                   * eleccion conserva el filete y va TACHADA -la convencion
                   * mas legible para «esto era lo tuyo y no era»- mientras que
                   * las demas pierden el borde y se apagan.
                   */
                  // Esperando: solo se dice cual elegiste.
                  pending && isChoice && 'border-fg-subtle text-fg',
                  pending && !isChoice && 'text-fg-subtle opacity-60',
                  // Ya corregido: los tres estados de verdad.
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

      {/* --- Veredicto y explicación -------------------------------------- */}
      <div
        /*
         * UNA sola región viva para el veredicto y la explicación. Si cada
         * pieza tuviera la suya, un lector de pantalla las leería en un orden
         * que no controlamos.
         */
        aria-live="polite"
        className="mt-6 min-h-[4.5rem]"
      >
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

/* ---------------------------------------------------------------- barra --- */

/**
 * Barra de 1px.
 *
 * `scaleX` sobre un filete, con `transform-origin` a la izquierda. Nunca
 * `width`: eso recalcularía el maquetado en cada fotograma.
 *
 * `instant` apaga la transición mientras el reloj corre: el valor ya cambia
 * cuatro veces por segundo y una transición encima lo haría ir por detrás del
 * número que tiene al lado.
 */
function Bar({
  value,
  tone,
  instant,
}: {
  value: number;
  tone: 'line' | 'accent';
  instant?: boolean;
}) {
  return (
    <div className="bg-line h-px w-full overflow-hidden">
      <div
        className={[
          'h-px w-full origin-left',
          tone === 'accent' ? 'bg-accent' : 'bg-fg-subtle',
          instant ? '' : 'ease-out-bp transition-transform duration-[var(--dur-3)]',
        ].join(' ')}
        style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------- resultado --- */

function Result({
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

      {/*
       * La puntuación es el objeto de esta pantalla, así que ocupa el tamaño
       * de un titular y no el de un dato. El acento va SOLO en el número
       * acertado: el total es contexto, no logro.
       */}
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
        {/* El acuse de copiado se anuncia; sin esto, quien no ve la pantalla no
            sabe si el botón hizo algo. */}
        <span aria-live="polite" className="text-fg-subtle text-sm">
          {shared ? labels.shareCopied : ''}
        </span>
      </div>
    </div>
  );
}
