import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { routing } from '../../../i18n/routing';
import { ArrowRightIcon, Container, Reveal, SectionHeading } from '@blackpink/ui';
import { JsonLd } from '../../../components/json-ld';
import { DebutCounter } from '../../../components/pages/debut-counter';
import { PageHeader } from '../../../components/pages/page-header';
import { daysSince, yearsSince } from '../../../lib/debut';
import { getMembers, getTimeline } from '../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from '../../../lib/seo';

const PATH = '/grupo';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'GroupPage' });
  return buildMetadata({ title: t('title'), description: t('description'), path: PATH, locale });
}

export default async function GroupPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'GroupPage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });

  /*
   * LA FECHA DEL DEBUT SALE DEL CATÁLOGO, no de una constante.
   *
   * Es el hito de categoría `DEBUT` de la cronología: un dato contrastado, con
   * su `source`, que ya se publica en `/cronologia`. Escribir aquí
   * "2016-08-08" crearía una segunda copia de un dato que ya existe, y el día
   * que alguien corrija una habría dos fechas del debut en el mismo sitio.
   *
   * Si hubiera más de un hito de debut se toma el PRIMERO por fecha: el debut
   * del grupo es el más antiguo de todos.
   */
  const [members, debut] = await Promise.all([
    getMembers({ locale }),
    getTimeline({ locale, category: 'DEBUT', limit: 10 })
      .then((page) => [...page.items].sort((x, y) => x.date.localeCompare(y.date))[0] ?? null)
      // Sin el hito, la página sigue entera y solo falta el contador: una
      // cifra que no se puede calcular no debe llevarse la página por delante.
      .catch(() => null),
  ]);

  const now = Date.now();

  const blocks = [
    { title: t('formation'), body: t('formationBody') },
    { title: t('concept'), body: t('conceptBody') },
    { title: t('records'), body: t('recordsBody') },
  ];

  return (
    <>
      {/*
       * Aqui SI se describe al grupo como MusicGroup, porque el tema de la
       * pagina ES el grupo. Lo que nunca se hace es declarar que este sitio
       * sea su web oficial: la entidad no lleva `url` propia, solo un
       * `subjectOf` que apunta a esta pagina como algo que habla DE ellos.
       */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'MusicGroup',
          name: 'BLACKPINK',
          foundingDate: '2016',
          genre: 'K-pop',
          member: members.map((member) => ({
            '@type': 'Person',
            name: member.stageName,
            url: `${SITE_URL}/${locale}/integrantes/${member.slug}`,
          })),
          subjectOf: {
            '@type': 'WebPage',
            url: `${SITE_URL}/${locale}${PATH}`,
            name: t('title'),
          },
        }}
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

      <PageHeader title={t('title')} description={t('description')} />

      {/* El contador abre la página porque responde antes que ningún texto a
          la primera pregunta que se le hace a un grupo: cuánto lleva. */}
      {debut ? (
        <DebutCounter
          debutDate={debut.date}
          initialDays={daysSince(debut.date, now)}
          initialYears={yearsSince(debut.date, now)}
          locale={locale}
          labels={{
            days: t('counterDays'),
            years: t('counterYears'),
            since: t('counterSince'),
          }}
        />
      ) : null}

      <Container width="wide" className="pb-section">
        {blocks.map((block, index) => (
          <Reveal key={block.title} delay={index * 0.06} className="py-block">
            <SectionHeading title={block.title} />
            <p className="text-fg-muted mt-6 max-w-prose text-pretty text-lg">{block.body}</p>
          </Reveal>
        ))}

        {/* --- Las cuatro, como salida hacia sus fichas --- */}
        <Reveal className="border-line border-t pt-8">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((member) => (
              <li key={member.slug}>
                <a
                  href={`/${locale}/integrantes/${member.slug}`}
                  className="group/link focus-visible:outline-focus flex items-baseline justify-between gap-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  <span>
                    <span className="font-display text-fg group-hover/link:text-accent-text ease-out-soft block text-xl font-bold transition-colors duration-[var(--dur-2)]">
                      {member.stageName}
                    </span>
                    <span className="text-fg-subtle block text-xs">{member.position}</span>
                  </span>
                  <ArrowRightIcon className="text-fg-subtle ease-out-bp shrink-0 transition-transform duration-[var(--dur-2)] group-hover/link:translate-x-1" />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </>
  );
}
