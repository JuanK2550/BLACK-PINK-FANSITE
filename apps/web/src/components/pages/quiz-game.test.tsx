// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QuizQuestion } from '@blackpink/types';

/**
 * ============================================================================
 * EL QUIZ
 * ============================================================================
 * LA ACCIÓN DE SERVIDOR SE SIMULA, y con eso se prueba lo que de verdad
 * importa: que el componente NO conoce la respuesta hasta que la pide. Si
 * alguien colara el `correctIndex` en las props, este fichero seguiría en
 * verde pero el test de secrecía —el que cuenta apariciones en el HTML— caería
 * en Playwright. Los dos hacen falta.
 *
 * Se comprueban las decisiones que costaron encontrar:
 *   - el estado de ESPERA entre responder y el veredicto,
 *   - que las opciones son BOTONES y no un grupo de radio,
 *   - que el reloj DESAPARECE al responder en vez de quedarse congelado,
 *   - que hay UNA sola región viva.
 * ============================================================================
 */

const gradeAnswer = vi.fn();

vi.mock('../../app/[locale]/quiz/actions', () => ({
  gradeAnswer: (...args: unknown[]) => gradeAnswer(...args),
}));

const { QuizGame } = await import('./quiz-game');

const PREGUNTAS: QuizQuestion[] = [
  {
    id: 'p1',
    question: '¿En que ano debuto BLACKPINK?',
    options: ['2014', '2015', '2016', '2017'],
    difficulty: 'EASY',
  } as QuizQuestion,
  {
    id: 'p2',
    question: '¿Cuantas integrantes tiene el grupo?',
    options: ['Tres', 'Cuatro', 'Cinco', 'Seis'],
    difficulty: 'EASY',
  } as QuizQuestion,
];

const LABELS: Record<string, string> = {
  title: 'Quiz',
  description: 'Descripción',
  difficulty: 'Dificultad',
  all: 'Todas',
  EASY: 'Fácil',
  MEDIUM: 'Media',
  HARD: 'Difícil',
  start: 'Empezar',
  progress: 'Pregunta {current} de {total}',
  timeLeft: '{seconds} s',
  timeUp: 'Se acabó el tiempo',
  correct: 'Correcto',
  incorrect: 'Incorrecto',
  wasAnswer: 'La respuesta era: {answer}',
  next: 'Siguiente',
  seeResult: 'Ver resultado',
  resultTitle: 'Tu resultado',
  retry: 'Reintentar',
  share: 'Compartir',
  shareCopied: 'Enlace copiado',
  shareText: 'He acertado {score} de {total}.',
  empty: 'Sin preguntas',
  verdictLow: 'Hay margen.',
  verdictMid: 'Bien.',
  verdictHigh: 'Impecable.',
  answering: 'Elige una respuesta',
  rules: '{count} preguntas · {seconds} segundos cada una',
};

/*
 * LA PARTIDA SE BARAJA, así que un test no puede dar por hecho qué pregunta
 * sale primero: `pintar()` con las dos fallaba una vez de cada dos buscando
 * «2016». Cuando un test necesita una pregunta concreta, se le pasa SOLA.
 */
function pintar(preguntas: QuizQuestion[] = PREGUNTAS) {
  return render(
    <QuizGame
      questions={preguntas}
      locale="es"
      labels={LABELS}
      counts={{ EASY: preguntas.length, MEDIUM: 0, HARD: 0 }}
    />,
  );
}

/** Solo la del debut: sus opciones son años y no se confunden con nada. */
const SOLO_DEBUT = [PREGUNTAS[0]!];

beforeEach(() => {
  gradeAnswer.mockReset();
});

describe('QuizGame', () => {
  it('las respuestas NO están en las props que recibe', () => {
    // La página las pide con `includeAnswers: false`. Es la regla del quiz.
    for (const pregunta of PREGUNTAS) {
      expect(pregunta).not.toHaveProperty('correctIndex');
      expect(pregunta).not.toHaveProperty('explanation');
    }
  });

  it('antes de empezar enseña las reglas, no la descripción otra vez', () => {
    pintar();
    expect(screen.getByText('2 preguntas · 20 segundos cada una')).toBeInTheDocument();
  });

  it('las opciones son BOTONES, no un grupo de radio', async () => {
    // Un radio deja mover la selección sin confirmarla; aquí pulsar ES
    // responder y no hay vuelta atrás. Un botón dice eso; un radio miente.
    const user = userEvent.setup();
    pintar(SOLO_DEBUT);
    await user.click(screen.getByRole('button', { name: 'Empezar' }));

    for (const opcion of PREGUNTAS[0]!.options) {
      expect(screen.getByRole('button', { name: opcion })).toBeInTheDocument();
    }
    // Y durante la partida no hay NINGÚN radio en pantalla: la barra de
    // dificultad solo existe antes de empezar y al terminar. Mientras se
    // juega, todo lo pulsable es un botón.
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('hay un estado de ESPERA entre responder y el veredicto', async () => {
    // Sin él, la opción elegida caía en la rama de error y una respuesta
    // correcta se veía TACHADA durante una fracción de segundo.
    let resolver: (valor: unknown) => void = () => {};
    gradeAnswer.mockReturnValue(new Promise((r) => (resolver = r)));

    const user = userEvent.setup();
    pintar(SOLO_DEBUT);
    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    await user.click(screen.getByRole('button', { name: '2016' }));

    // Mientras espera: ni «Correcto» ni «Incorrecto», y nada tachado.
    expect(screen.queryByText('Correcto')).not.toBeInTheDocument();
    expect(screen.queryByText('Incorrecto')).not.toBeInTheDocument();
    expect(document.querySelector('.line-through')).toBeNull();

    resolver({ correct: true, correctIndex: 2, explanation: 'Debutaron en 2016.' });
    await waitFor(() => expect(screen.getByText('Correcto')).toBeInTheDocument());
  });

  it('al acertar muestra la explicación que trae la pregunta', async () => {
    gradeAnswer.mockResolvedValue({
      correct: true,
      correctIndex: 2,
      explanation: 'Debutaron el 8 de agosto de 2016.',
    });

    const user = userEvent.setup();
    pintar(SOLO_DEBUT);
    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    await user.click(screen.getByRole('button', { name: '2016' }));

    await waitFor(() =>
      expect(screen.getByText('Debutaron el 8 de agosto de 2016.')).toBeInTheDocument(),
    );
  });

  it('al fallar tacha lo elegido y dice cuál era', async () => {
    // Al principio la elegida y las no elegidas solo se separaban por opacidad
    // y no se veía cuál habías marcado.
    gradeAnswer.mockResolvedValue({ correct: false, correctIndex: 2, explanation: null });

    const user = userEvent.setup();
    pintar(SOLO_DEBUT);
    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    await user.click(screen.getByRole('button', { name: '2014' }));

    await waitFor(() => expect(screen.getByText('La respuesta era: 2016')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '2014' }).className).toContain('line-through');
  });

  it('el reloj DESAPARECE al responder en vez de quedarse congelado', async () => {
    gradeAnswer.mockResolvedValue({ correct: true, correctIndex: 2, explanation: null });

    const user = userEvent.setup();
    pintar(SOLO_DEBUT);
    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(screen.getByText(/\d+ s/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2016' }));
    await waitFor(() => expect(screen.queryByText(/\d+ s/)).not.toBeInTheDocument());
  });

  it('una sola región viva para el veredicto y la explicación', async () => {
    // Con una por pieza, el lector de pantalla las leería en un orden que no
    // controlamos.
    const user = userEvent.setup();
    const { container } = pintar();
    await user.click(screen.getByRole('button', { name: 'Empezar' }));

    expect(container.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
  });

  it('la última pregunta ofrece ver el resultado, no «Siguiente»', async () => {
    gradeAnswer.mockResolvedValue({ correct: true, correctIndex: 2, explanation: null });

    const user = userEvent.setup();
    pintar();
    await user.click(screen.getByRole('button', { name: 'Empezar' }));

    await user.click(screen.getAllByRole('button', { name: /2014|Tres/ })[0]!);
    await waitFor(() => screen.getByRole('button', { name: 'Siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await user.click(screen.getAllByRole('button', { name: /2014|Tres/ })[0]!);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeInTheDocument(),
    );
  });
});
