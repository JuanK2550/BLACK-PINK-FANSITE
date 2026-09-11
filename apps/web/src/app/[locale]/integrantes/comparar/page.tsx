import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale, MemberDetail } from '@blackpink/types';
import { ArrowRightIcon, Container, EmptyState } from '@blackpink/ui';
import { routing } from '../../../../i18n/routing';
import { JsonLd } from '../../../../components/json-ld';
import { MemberCompare } from '../../../../components/pages/member-compare';
import { PageHeader } from '../../../../components/pages/page-header';
import { getMember, getMembers } from '../../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '../../../../lib/seo';

const PATH = '/integrantes/comparar';

/**
 * ============================================================================
 * COMPARADOR — LA PÁGINA
 * ============================================================================
 * RUTA PROPIA, y anidada bajo `/integrantes` para que la dirección diga qué
 * compara. Next resuelve el segmento estático `comparar` antes que el
 * dinámico `[slug]`, así que no compite con la ficha de ninguna integrante.
 *
 * LAS CUATRO FICHAS COMPLETAS SE PIDEN AQUÍ, en el servidor, y viajan enteras
 * al componente. Son cuatro y cambian poco: con todo en la página, cambiar de
 * selección es instantáneo y no cuesta una vuelta al servidor. Pedir solo las
 * dos elegidas ahorraría unos kilobytes y convertiría cada clic en una espera.
 *
 * `?a=` y `?b=` NO SE CREEN: se validan contra los slugs que existen. Lo que
 * llega por una URL es lo que alguien escribió en una URL.
 * ============================================================================
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ComparePage' });
  return buildMetadata({ title: t('title'), description: t('description'), path: PATH, locale });
}

/** Lee un slug de la consulta y lo valida contra los que existen. */
function readSlug(
  value: string | string[] | undefined,
  members: MemberDetail[],
): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return members.some((member) => member.slug === raw) ? raw : undefined;
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'ComparePage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  const membersCopy = await getTranslations({ locale, namespace: 'MembersPage' });

  const summaries = await getMembers({ locale }).catch(() => []);
  const members = (
    await Promise.all(
      summaries.map((member) =>
        getMember(member.slug, { locale }).catch(() => null as MemberDetail | null),
      ),
    )
  ).filter((member): member is MemberDetail => member !== null);

  const query = await searchParams;

  /*
   * Con menos de dos fichas no hay comparación posible. Es el caso de una API
   * caída, no de un catálogo vacío, pero el visitante ve lo mismo y merece un
   * texto y no una página rota.
   */
  const canCompare = members.length >= 2;

  const a = readSlug(query.a, members) ?? members[0]?.slug ?? '';
  // La segunda nunca puede ser la primera: una comparación de alguien consigo
  // misma no dice nada, y `?a=lisa&b=lisa` es una URL que alguien puede
  // escribir.
  const fromQuery = readSlug(query.b, members);
  const b =
    fromQuery && fromQuery !== a
      ? fromQuery
      : (members.find((member) => member.slug !== a)?.slug ?? '');

  const keys = [
    'slotA',
    'slotB',
    'swap',
    'realName',
    'koreanName',
    'birthDate',
    'nationality',
    'soloCount',
    'firstSolo',
    'ageGap',
    'ageGapOne',
    'sameDay',
    'photoCredits',
  ] as const;

  /*
   * Las etiquetas se pasan EN CRUDO (`t.raw`), igual que en el quiz: `ageGap`
   * lleva `{older}`, `{younger}` y `{days}`, y quien sustituye es el
   * componente. Con la llamada normal, next-intl intentaría formatear el ICU
   * sin recibir las variables y lanzaría FORMATTING_ERROR. De paso evita meter
   * el namespace en `CLIENT_NAMESPACES`, que lo haría viajar en el bundle de
   * todas las páginas del sitio.
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
            { name: membersCopy('title'), path: '/integrantes' },
            { name: t('title'), path: PATH },
          ],
          locale,
        )}
      />

      <PageHeader title={t('title')} description={t('description')} aside={`${members.length}`} />

      {/*
       * `wide` para que el borde izquierdo caiga donde el de la cabecera, y
       * un ancho máximo dentro: a 1600px, dos columnas sin tope dejarían dos
       * retratos de casi 800px y una tabla que hay que recorrer con el
       * cuello. La comparación se lee mejor junta.
       */}
      <Container width="wide" className="pb-section">
        <div className="max-w-3xl">
          {canCompare ? (
            <MemberCompare
              members={members}
              locale={locale}
              initialA={a}
              initialB={b}
              labels={labels}
              creditsHref={`/${locale}/creditos`}
            />
          ) : (
            <EmptyState title={t('empty')} description={t('description')} />
          )}

          <a
            href={`/${locale}/integrantes`}
            className="group/back border-line hover:border-line-strong focus-visible:outline-focus ease-out-soft mt-section flex items-center justify-between gap-6 border-t py-8 transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <span className="font-display text-fg group-hover/back:text-accent-text ease-out-soft text-2xl font-bold transition-colors duration-[var(--dur-2)]">
              {t('backToMembers')}
            </span>
            <ArrowRightIcon className="text-fg-subtle ease-out-bp shrink-0 text-2xl transition-transform duration-[var(--dur-3)] group-hover/back:translate-x-2" />
          </a>
        </div>
      </Container>
    </>
  );
}
