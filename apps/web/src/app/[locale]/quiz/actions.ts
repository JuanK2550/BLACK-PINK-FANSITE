'use server';

import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';
import { getQuizQuestions } from '../../../lib/api';

/**
 * ============================================================================
 * CORREGIR UNA RESPUESTA, EN EL SERVIDOR
 * ============================================================================
 * ESTA ES LA PIEZA QUE SOSTIENE LA REGLA DEL QUIZ: la respuesta correcta no
 * llega al navegador hasta que alguien ha respondido.
 *
 * La página pide las preguntas con `includeAnswers: false`, así que lo que
 * viaja al cliente son el enunciado y las opciones y nada más: ni
 * `correctIndex` ni `explanation`. Mirar el código fuente de la página, o el
 * payload de red, no adelanta ni una respuesta.
 *
 * Cuando alguien contesta, se llama aquí. Esto corre en el servidor, vuelve a
 * pedir ESA pregunta con las respuestas incluidas y devuelve solo el veredicto
 * de la que se ha elegido.
 *
 * POR QUÉ UNA SERVER ACTION Y NO UN ENDPOINT NUEVO: no hay que exponer,
 * versionar ni proteger una ruta más, y la comparación ocurre donde ya vive el
 * secreto. El gateway sigue siendo la única puerta a content-service.
 *
 * LO QUE ESTO NO PRETENDE SER. No impide que alguien llame a la acción a mano
 * para descubrir una respuesta: para eso le basta con responder. Lo que impide
 * es que las 25 respuestas estén en la página desde el primer segundo, que es
 * la diferencia entre un quiz y una lista de soluciones.
 *
 * `includeUnverified` NO se envía nunca desde aquí, igual que en el resto de
 * `apps/web`: el quiz solo pregunta por datos contrastados, porque corregir a
 * alguien con un dato dudoso es peor que no preguntarlo.
 * ============================================================================
 */

export interface GradeResult {
  correct: boolean;
  /** Índice de la opción correcta. Se revela SOLO al responder. */
  correctIndex: number;
  /** Por qué es esa. Puede no existir en una pregunta concreta. */
  explanation: string | null;
}

export async function gradeAnswer(
  questionId: string,
  choiceIndex: number | null,
  locale: Locale,
): Promise<GradeResult | null> {
  /*
   * El locale llega del cliente, así que se valida contra la lista del
   * contrato antes de usarlo. Un valor arbitrario no debe convertirse en un
   * parámetro de consulta hacia el gateway.
   */
  if (!SUPPORTED_LOCALES.includes(locale)) return null;

  /*
   * Se piden todas las preguntas y se busca la del id.
   *
   * Sería más directo un endpoint `quiz/questions/{id}`, pero no existe y
   * añadirlo al gateway y al servicio por una comparación es más superficie de
   * la que hace falta: son 25 preguntas y la respuesta va cacheada.
   */
  const { items } = await getQuizQuestions(
    { locale, includeAnswers: true, limit: 100 },
    { revalidate: 300 },
  );

  const question = items.find((item) => item.id === questionId);
  if (!question || typeof question.correctIndex !== 'number') return null;

  return {
    correct: choiceIndex === question.correctIndex,
    correctIndex: question.correctIndex,
    explanation: question.explanation ?? null,
  };
}
