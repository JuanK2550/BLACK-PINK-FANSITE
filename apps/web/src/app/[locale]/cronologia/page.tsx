import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { routing } from '../../../i18n/routing';
import { Container } from '@blackpink/ui';
import { JsonLd } from '../../../components/json-ld';
import { PageHeader } from '../../../components/pages/page-header';
import { TimelineExplorer } from '../../../components/pages/timeline-explorer';
import { getMembers, getTimeline } from '../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '../../../lib/seo';

const PATH = '/cronologia';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'TimelinePage' });
  return buildMetadata({ title: t('title'), description: t('description'), path: PATH, locale });
}

export default async function TimelinePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'TimelinePage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });

  const [timeline, members] = await Promise.all([
    getTimeline({ locale, limit: 100 }),
    getMembers({ locale }),
  ]);

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

      <PageHeader
        title={t('title')}
        description={t('description')}
        aside={`${timeline.items.length}`}
      />

      <Container width="wide" className="pb-section">
        <TimelineExplorer events={timeline.items} members={members} locale={locale} />
      </Container>
    </>
  );
}
