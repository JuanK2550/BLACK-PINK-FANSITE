// Página del quiz.

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale, QuizDifficulty } from '@blackpink/types';
import { Container } from '@blackpink/ui';
import { JsonLd } from '../../../components/layout/json-ld';
import { PageHeader } from '../../../components/layout/page-header';
import { QuizGame } from '../../../components/quiz/quiz-game';
import { getQuizQuestions } from '../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd, SITE_URL } from '../../../lib/seo';

const PATH = '/quiz';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readCount(value: string | string[] | undefined, max: number): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) return null;
  return parsed;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations({ locale, namespace: 'QuizPage' });

  const base = buildMetadata({
    title: t('title'),
    description: t('description'),
    path: PATH,
    locale,
  });

  const total = readCount(query.total, 50);
  const score = readCount(query.score, total ?? 50);

  if (score === null || total === null) return base;

  const image = `${SITE_URL}/api/og/quiz?score=${score}&total=${total}&locale=${locale}`;

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: t('ogAlt', { score, total }),
        },
      ],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

export default async function QuizPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'QuizPage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });

  const { items } = await getQuizQuestions({
    locale,
    // Las respuestas no viajan al navegador: se corrigen en el servidor (actions.ts).
    includeAnswers: false,
    limit: 100,
  }).catch(() => ({ items: [] }));

  const counts = items.reduce<Record<string, number>>((acc, question) => {
    acc[question.difficulty] = (acc[question.difficulty] ?? 0) + 1;
    return acc;
  }, {});

  const keys = [
    'title',
    'description',
    'difficulty',
    'all',
    'EASY',
    'MEDIUM',
    'HARD',
    'start',
    'startAgain',
    'progress',
    'timeLeft',
    'timeUp',
    'correct',
    'incorrect',
    'wasAnswer',
    'next',
    'seeResult',
    'resultTitle',
    'scoreLine',
    'retry',
    'share',
    'shareCopied',
    'shareText',
    'empty',
    'verdictLow',
    'verdictMid',
    'verdictHigh',
    'answering',
    'rules',
  ] as const;

  const labels = Object.fromEntries(keys.map((key) => [key, t.raw(key) as string]));

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          name: t('title'),
          description: t('description'),
          path: PATH,
          locale,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: nav('grupo'), path: '/' },
            { name: t('title'), path: PATH },
          ],
          locale,
        )}
      />

      <PageHeader title={t('title')} description={t('description')} aside={`${items.length}`} />

      <Container width="wide" className="pb-section">
        <QuizGame
          questions={items}
          locale={locale}
          labels={labels}
          counts={counts as Record<QuizDifficulty, number>}
        />
      </Container>
    </>
  );
}
