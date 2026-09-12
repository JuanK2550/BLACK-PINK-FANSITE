// Página de premios.

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { routing } from '../../../i18n/routing';
import { Container, EmptyState, Reveal } from '@blackpink/ui';
import { JsonLd } from '../../../components/layout/json-ld';
import { PageHeader } from '../../../components/layout/page-header';
import { getAwards } from '../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '../../../lib/seo';

const PATH = '/premios';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AwardsPage' });
  return buildMetadata({ title: t('title'), description: t('description'), path: PATH, locale });
}

export default async function AwardsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'AwardsPage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  const { items } = await getAwards({ locale, limit: 100 });

  const byYear = items.reduce<Record<number, typeof items>>((groups, award) => {
    (groups[award.year] ??= []).push(award);
    return groups;
  }, {});

  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

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
        {items.length > 0 ? (
          <div className="border-line mb-block max-w-prose border-t pt-4">
            <p className="text-fg-subtle text-pretty text-xs">{t('yearNote')}</p>
            <p className="text-fg-subtle mt-2 text-pretty text-xs">{t('nominationsNote')}</p>
          </div>
        ) : null}

        {items.length === 0 ? (
          <EmptyState title={t('title')} description={t('pendingNotice')} />
        ) : (
          years.map((year, groupIndex) => (
            <Reveal
              key={year}
              delay={groupIndex * 0.05}
              className="border-line border-t pb-10 pt-6"
            >
              <div className="flex items-baseline gap-4">
                <h2 data-numeric className="font-display text-accent-text text-3xl font-extrabold">
                  {year}
                </h2>
                <p data-numeric className="text-fg-subtle text-2xs" data-uppercase>
                  {t('awardCount', { count: byYear[year]!.length })}
                </p>
              </div>

              <ul className="mt-6">
                {byYear[year]!.map((award) => (
                  <li
                    key={award.id}
                    className="border-line grid gap-x-6 gap-y-1 border-b py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_14rem_7rem] md:items-baseline"
                  >
                    <div className="min-w-0">
                      <p
                        className={
                          award.won
                            ? 'text-fg text-pretty text-base'
                            : 'text-fg-muted text-pretty text-base'
                        }
                      >
                        {award.name}
                      </p>
                      {award.work ? (
                        <p className="text-fg-subtle mt-0.5 text-pretty text-sm">
                          {t('forWork')} <cite className="not-italic">{award.work}</cite>
                        </p>
                      ) : null}
                    </div>
                    <p className="text-fg-muted text-sm">{award.organization}</p>
                    <p className="text-2xs md:text-right" data-uppercase>
                      {award.won ? (
                        <span className="text-fg">{t('won')}</span>
                      ) : (
                        <span className="text-fg-subtle">{t('nominated')}</span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))
        )}

        {items.length > 0 ? (
          <footer className="border-line mt-block max-w-prose border-t pt-6">
            <h2 className="text-fg-muted text-2xs" data-uppercase>
              {t('glossaryTitle')}
            </h2>
            <p className="text-fg-subtle mt-3 text-pretty text-xs">{t('bonsang')}</p>
            <p className="text-fg-subtle mt-2 text-pretty text-xs">{t('daesang')}</p>
          </footer>
        ) : null}
      </Container>
    </>
  );
}
