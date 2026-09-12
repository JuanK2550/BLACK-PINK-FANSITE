// Corrige una respuesta del quiz en el servidor.
'use server';

import { SUPPORTED_LOCALES, type Locale } from '@blackpink/types';
import { getQuizQuestions } from '../../../lib/api';

export interface GradeResult {
  correct: boolean;
  correctIndex: number;
  explanation: string | null;
}

export async function gradeAnswer(
  questionId: string,
  choiceIndex: number | null,
  locale: Locale,
): Promise<GradeResult | null> {
  if (!SUPPORTED_LOCALES.includes(locale)) return null;

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
