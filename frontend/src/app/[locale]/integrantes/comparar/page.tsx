// Página del comparador de integrantes.

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale, MemberDetail } from '@blackpink/types';
import { ArrowRightIcon, Container, EmptyState } from '@blackpink/ui';
import { routing } from '../../../../i18n/routing';
import { JsonLd } from '../../../../components/layout/json-ld';
import { MemberCompare } from '../../../../components/members/member-compare';
import { PageHeader } from '../../../../components/layout/page-header';
import { getMember, getMembers } from '../../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '../../../../lib/seo';

const PATH = '/integrantes/comparar';

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

  const canCompare = members.length >= 2;

  const a = readSlug(query.a, members) ?? members[0]?.slug ?? '';
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
