// Ficha de una integrante con su discografía en solitario.

import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { formatDate } from '../../../../lib/format';
import { routing } from '../../../../i18n/routing';
import { ArrowRightIcon, Container, FlipCard, Reveal, SectionHeading } from '@blackpink/ui';
import { JsonLd } from '../../../../components/layout/json-ld';
import { SoloDiscography } from '../../../../components/members/solo-discography';
import { MemberPhoto } from '../../../../components/members/member-photo';
import { ApiError, getMember, getMembers } from '../../../../lib/api';
import { breadcrumbJsonLd, buildMetadata, personJsonLd } from '../../../../lib/seo';

interface PageProps {
  params: Promise<{ slug: string; locale: Locale }>;
}

export async function generateStaticParams() {
  try {
    const members = await getMembers({ locale: routing.defaultLocale });
    return routing.locales.flatMap((locale) =>
      members.map((member) => ({ locale, slug: member.slug })),
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  try {
    const member = await getMember(slug, { locale });
    return buildMetadata({
      title: member.stageName,
      description:
        member.description ??
        member.bio?.slice(0, 155) ??
        `${member.stageName}, ${member.position} de BLACKPINK.`,
      path: `/integrantes/${slug}`,
      locale,
    });
  } catch {
    return { title: 'No encontrada', robots: { index: false, follow: true } };
  }
}

export default async function MemberPage({ params }: PageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'MemberPage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  const embed = await getTranslations({ locale, namespace: 'Embed' });
  const cats = await getTranslations({ locale, namespace: 'TriviaCategories' });
  const membersCopy = await getTranslations({ locale, namespace: 'MembersPage' });
  const a11y = await getTranslations({ locale, namespace: 'A11y' });

  let member;
  let all;
  try {
    [member, all] = await Promise.all([getMember(slug, { locale }), getMembers({ locale })]);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const accent = member.colorAccent ?? 'var(--color-accent)';
  const memberInk = { '--bp-member': member.colorAccent ?? undefined } as CSSProperties;
  const index = all.findIndex((entry) => entry.slug === member.slug);
  const next = all[(index + 1) % all.length];

  return (
    <>
      <JsonLd data={personJsonLd(member, `/integrantes/${slug}`, locale)} />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: nav('grupo'), path: '/' },
            { name: membersCopy('title'), path: '/integrantes' },
            { name: member.stageName, path: `/integrantes/${slug}` },
          ],
          locale,
        )}
      />

      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
          style={{
            background: `radial-gradient(60% 60% at 20% 0%, color-mix(in oklab, ${accent} 22%, transparent), transparent 70%)`,
          }}
        />

        <Container width="wide" className="pt-block pb-block">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <MemberPhoto member={member} sizes="(max-width: 1024px) 92vw, 40vw" priority />
            </div>

            <div className="lg:col-span-7 lg:pt-8">
              <h1 className="font-display text-fg text-5xl font-extrabold">{member.stageName}</h1>

              <p className="bp-member-ink mt-3 text-lg" style={memberInk}>
                {member.position}
              </p>

              {member.description ? (
                <p className="text-fg-muted mt-6 max-w-prose text-pretty text-lg">
                  {member.description}
                </p>
              ) : null}

              <dl className="border-line mt-block grid gap-x-8 gap-y-4 border-t pt-6 sm:grid-cols-2">
                <Fact label={t('realName')} value={member.fullName} />
                <Fact label={t('koreanName')} value={member.koreanName} lang="ko" />
                <Fact
                  label={t('birthDate')}
                  value={member.birthDate}
                  display={member.birthDate ? formatDate(member.birthDate, locale) : null}
                />
                <Fact label={t('nationality')} value={member.nationality} />
                <Fact label={t('position')} value={member.position} />
              </dl>
            </div>
          </div>
        </Container>
      </section>

      {member.bio ? (
        <Container width="wide" className="py-section">
          <Reveal>
            <SectionHeading title={t('biography')} />
            <div className="mt-block max-w-prose">
              {member.bio
                .split('\n')
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i} className="text-fg-muted mt-4 text-pretty text-base first:mt-0">
                    {paragraph}
                  </p>
                ))}
            </div>
          </Reveal>
        </Container>
      ) : null}

      {member.timeline.length > 0 ? (
        <Container width="wide" className="py-section">
          <SectionHeading title={t('timeline')} />

          <ol className="mt-block relative max-w-prose">
            <span
              aria-hidden="true"
              className="bg-line-strong absolute bottom-2 left-[5px] top-2 w-px"
            />

            {member.timeline.map((event, i) => (
              <Reveal
                as="li"
                key={event.id}
                delay={i * 0.04}
                className="relative pb-8 pl-8 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: accent }}
                />
                <time data-numeric className="text-fg-subtle text-xs" dateTime={event.date}>
                  {formatDate(event.date, locale, event.datePrecision)}
                </time>
                <p className="font-display text-fg mt-1 text-balance text-xl font-bold">
                  {event.title}
                </p>
                {event.description ? (
                  <p className="text-fg-muted mt-2 text-pretty text-sm">{event.description}</p>
                ) : null}
              </Reveal>
            ))}
          </ol>
        </Container>
      ) : null}

      {member.soloWorks.length > 0 ? (
        <Container width="wide" className="py-section">
          <SectionHeading title={t('soloWork')} />

          <SoloDiscography
            works={member.soloWorks}
            locale={locale}
            labels={{
              coverAlt: a11y.raw('coverAlt') as string,
              titleTrack: t('titleTrack'),
              featuring: t.raw('featuring') as string,
              tracks: t.raw('trackCount') as string,
              spotifyTitle: embed.raw('spotifyTitle') as string,
              openOnSpotify: embed('openOnSpotify'),
              unavailable: embed('unavailable'),
              playTrack: embed.raw('playTrack') as string,
              closeTrack: embed.raw('closeTrack') as string,
            }}
          />
        </Container>
      ) : null}

      {member.trivia.length > 0 ? (
        <Container width="wide" className="py-section">
          <SectionHeading title={t('trivia')} description={t('flipHint')} />

          <ul className="mt-block grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {member.trivia.map((fact, i) => (
              <Reveal as="li" key={fact.id} delay={i * 0.04}>
                <FlipCard
                  label={`${t('sourceLabel')}: ${fact.content}`}
                  front={
                    <span className="bg-surface shadow-hairline flex min-h-40 flex-col justify-between p-5">
                      <span className="text-fg text-pretty text-base">{fact.content}</span>
                      <span className="text-fg-subtle text-2xs mt-4" data-uppercase>
                        {cats(fact.category)}
                      </span>
                    </span>
                  }
                  back={
                    <span
                      className="bg-overlay shadow-hairline flex min-h-40 flex-col justify-between p-5"
                      style={{
                        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 40%, transparent)`,
                      }}
                    >
                      <span className="text-fg-muted text-pretty text-xs">{fact.source}</span>
                      <span
                        className="bp-member-ink text-2xs mt-4"
                        style={memberInk}
                        data-uppercase
                      >
                        {t('sourceLabel')}
                      </span>
                    </span>
                  }
                />
              </Reveal>
            ))}
          </ul>
        </Container>
      ) : null}

      {next ? (
        <Container width="wide" className="pb-section">
          <a
            href={`/${locale}/integrantes/${next.slug}`}
            aria-label={`${t('nextLabel')} ${next.stageName}`}
            className="group/next border-line hover:border-line-strong focus-visible:outline-focus ease-out-soft flex items-center justify-between gap-6 border-t py-10 transition-colors duration-[var(--dur-2)] focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <span>
              <span className="text-fg-subtle text-2xs block" data-uppercase>
                {t('next')}
              </span>
              <span className="font-display text-fg group-hover/next:text-accent-text ease-out-soft mt-2 block text-4xl font-extrabold transition-colors duration-[var(--dur-2)]">
                {next.stageName}
              </span>
            </span>
            <ArrowRightIcon className="text-fg-subtle ease-out-bp shrink-0 text-3xl transition-transform duration-[var(--dur-3)] group-hover/next:translate-x-2" />
          </a>
        </Container>
      ) : null}
    </>
  );
}

function Fact({
  label,
  value,
  lang,
  display,
}: {
  label: string;
  value: string | null;
  lang?: string;
  display?: string | null;
}) {
  if (!value) return null;

  return (
    <div>
      <dt className="text-fg-subtle text-2xs" data-uppercase>
        {label}
      </dt>
      <dd className="text-fg mt-1 text-base" lang={lang}>
        {display ? (
          <time dateTime={value} data-numeric>
            {display}
          </time>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
