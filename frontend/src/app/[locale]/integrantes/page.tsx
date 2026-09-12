// Página con las cuatro integrantes.

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { routing } from '../../../i18n/routing';
import { ArrowRightIcon, Container, Reveal, TiltCard } from '@blackpink/ui';
import { JsonLd } from '../../../components/layout/json-ld';
import { MemberPhoto } from '../../../components/members/member-photo';
import { PageHeader } from '../../../components/layout/page-header';
import { getMembers } from '../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '../../../lib/seo';

const PATH = '/integrantes';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'MembersPage' });
  return buildMetadata({ title: t('title'), description: t('description'), path: PATH, locale });
}

export default async function MembersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'MembersPage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  const members = await getMembers({ locale });

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

      <PageHeader title={t('title')} description={t('lead')} aside={`${members.length} · 2016`} />

      <Container width="wide" className="pb-section">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, index) => (
            <Reveal as="li" key={member.slug} delay={index * 0.05}>
              <TiltCard accent={member.colorAccent} className="h-full">
                <a
                  href={`/${locale}/integrantes/${member.slug}`}
                  className="focus-visible:outline-focus block focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  <MemberPhoto
                    member={member}
                    zoom
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23vw"
                    priority={index < 2}
                  />

                  <p className="font-display text-fg mt-4 text-2xl font-bold">{member.stageName}</p>
                  <p className="text-fg-muted mt-1 text-sm">{member.position}</p>
                  {member.koreanName ? (
                    <p className="text-fg-subtle text-xs" lang="ko">
                      {member.koreanName}
                    </p>
                  ) : null}

                  <span
                    aria-hidden="true"
                    className="ease-out-bp mt-4 block h-px w-full origin-left scale-x-0 transition-transform duration-[var(--dur-3)] group-hover/tilt:scale-x-100"
                    style={{ backgroundColor: member.colorAccent ?? 'var(--color-accent)' }}
                  />
                </a>
              </TiltCard>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.2}>
          <a
            href={`/${locale}/integrantes/comparar`}
            className="group/compare border-line hover:border-line-strong focus-visible:outline-focus ease-out-soft mt-section flex items-center justify-between gap-6 border-t py-10 transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <span>
              <span className="font-display text-fg group-hover/compare:text-accent-text ease-out-soft block text-3xl font-extrabold transition-colors duration-[var(--dur-2)]">
                {t('compareTitle')}
              </span>
              <span className="text-fg-muted mt-2 block max-w-prose text-pretty text-sm">
                {t('compareLead')}
              </span>
            </span>
            <ArrowRightIcon className="text-fg-subtle ease-out-bp shrink-0 text-3xl transition-transform duration-[var(--dur-3)] group-hover/compare:translate-x-2" />
          </a>
        </Reveal>
      </Container>
    </>
  );
}
