// Página de playlists.

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { Container, Reveal } from '@blackpink/ui';
import { JsonLd } from '../../../components/layout/json-ld';
import { PageHeader } from '../../../components/layout/page-header';
import { routing } from '../../../i18n/routing';
import { getPlaylist, getPlaylists } from '../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, SITE_URL, webPageJsonLd } from '../../../lib/seo';

const PATH = '/playlists';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PlaylistsPage' });
  return buildMetadata({ title: t('title'), description: t('description'), path: PATH, locale });
}

export default async function PlaylistsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'PlaylistsPage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  const embed = await getTranslations({ locale, namespace: 'Embed' });

  const summaries = await getPlaylists({ locale });

  const playlists = await Promise.all(
    summaries.map(async (summary) => ({
      summary,
      detail: await getPlaylist(summary.slug, { locale }).catch(() => null),
    })),
  );

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
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: t('title'),
          numberOfItems: summaries.length,
          itemListElement: summaries.map((playlist, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'MusicPlaylist',
              name: playlist.title,
              description: playlist.description,
              numTracks: playlist.trackCount,
              url: `${SITE_URL}/${locale}${PATH}`,
            },
          })),
        }}
      />

      <PageHeader title={t('title')} description={t('description')} aside={`${summaries.length}`} />

      <Container width="wide" className="pb-section">
        <p className="border-line text-fg-subtle mb-block max-w-prose text-pretty border-t pt-4 text-xs">
          {embed('officialNotice')}
        </p>

        <ul className="grid gap-x-8 gap-y-10 md:grid-cols-2">
          {playlists.map(({ summary, detail }, index) => (
            <Reveal as="li" key={summary.slug} delay={index * 0.05}>
              <article className="border-line flex h-full flex-col border-t pt-5">
                <div className="min-w-0">
                  <h2 className="font-display text-fg text-balance text-2xl font-bold">
                    {summary.title}
                  </h2>

                  <p className="text-fg-subtle text-2xs mt-2" data-uppercase>
                    <span data-numeric>{summary.trackCount}</span> {t('trackCount')}
                    {' · '}
                    {summary.basis === 'curated' ? t('curated') : t('derived')}
                  </p>
                </div>

                <p className="text-fg-muted mt-4 text-pretty text-sm">{summary.description}</p>

                {detail ? (
                  <>
                    <ol className="mt-5 flex-1">
                      {detail.entries.slice(0, 5).map((entry) => (
                        <li
                          key={entry.position}
                          className="border-line flex items-baseline gap-3 border-b py-2 last:border-b-0"
                        >
                          <span data-numeric className="text-fg-subtle w-5 shrink-0 text-xs">
                            {String(entry.position).padStart(2, '0')}
                          </span>
                          <span className="text-fg min-w-0 flex-1 truncate text-sm">
                            {entry.title}
                          </span>
                          {entry.subtitle ? (
                            <span className="text-fg-subtle shrink-0 truncate text-xs">
                              {entry.subtitle}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ol>

                    {detail.entries.length > 5 ? (
                      <p className="text-fg-subtle mt-2 text-xs">
                        + <span data-numeric>{detail.entries.length - 5}</span>
                      </p>
                    ) : null}

                    {detail.playableCount === 0 ? (
                      <p className="text-fg-subtle mt-4 text-xs">{t('nonedPlayable')}</p>
                    ) : null}
                  </>
                ) : null}
              </article>
            </Reveal>
          ))}
        </ul>
      </Container>
    </>
  );
}
