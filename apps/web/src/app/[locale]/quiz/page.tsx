import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale, QuizDifficulty } from '@blackpink/types';
import { Container } from '@blackpink/ui';
import { JsonLd } from '../../../components/json-ld';
import { PageHeader } from '../../../components/pages/page-header';
import { QuizGame } from '../../../components/pages/quiz-game';
import { getQuizQuestions } from '../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd, SITE_URL } from '../../../lib/seo';

const PATH = '/quiz';

/**
 * ============================================================================
 * QUIZ
 * ============================================================================
 * LA PÁGINA NO CONOCE LAS RESPUESTAS. Las preguntas se piden con
 * `includeAnswers: false`, así que lo que se serializa al navegador son el
 * enunciado y las opciones. Corregir es cosa de `actions.ts`, en el servidor.
 *
 * ES DINÁMICA, y no por descuido: la tarjeta que se comparte lleva la
 * puntuación en la URL (`?score=&total=`) y `generateMetadata` la lee para
 * apuntar a la imagen Open Graph correcta. Una página estática no puede
 * cambiar su tarjeta según la consulta.
 * ============================================================================
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Lee un entero de la consulta, acotado. Lo que llega de una URL no se cree. */
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

  // Sin puntuación en la URL, la tarjeta es la del sitio. Solo un resultado
  // compartido merece una imagen propia.
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

  /*
   * `includeAnswers: false` es la línea que importa de todo este fichero.
   * Se piden todas las preguntas de una vez y el reparto por dificultad y el
   * barajado ocurren en el cliente: son 25 filas, y así cambiar de dificultad
   * no cuesta una vuelta al servidor.
   */
  const { items } = await getQuizQuestions({
    locale,
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

  /*
   * Las etiquetas se pasan en CRUDO (`t.raw`) porque varias llevan `{score}`,
   * `{current}` o `{answer}` y quien sustituye es el componente, no next-intl.
   * Con la llamada normal, next-intl intentaría formatear el ICU sin recibir
   * la variable y lanzaría FORMATTING_ERROR, que es exactamente el fallo que
   * ya apareció en las fichas de álbum e integrante.
   *
   * Además evita meter el namespace entero en `CLIENT_NAMESPACES`, que lo
   * haría viajar en el bundle de TODAS las páginas y no solo de esta.
   */
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
