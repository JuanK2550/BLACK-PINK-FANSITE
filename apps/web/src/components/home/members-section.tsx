import { getTranslations } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { SectionHeading, Skeleton } from '@blackpink/ui';
import { MemberPhoto } from '../member-photo';
import { getMembers } from '../../lib/api';
import { SectionError, SectionFrame } from '../section-frame';

/**
 * Integrantes. Server Component: los datos se piden en el servidor y al
 * navegador llega HTML, sin JavaScript de carga ni parpadeo.
 *
 * El idioma llega como prop desde la ruta y viaja tanto a las traducciones de
 * interfaz como a la llamada de la API: la etiqueta de la sección y el papel
 * de cada integrante tienen que salir en el mismo idioma.
 */
export async function MembersSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' });

  let members;
  try {
    members = await getMembers({ locale });
  } catch (error) {
    return (
      <SectionFrame id="integrantes">
        <SectionError
          locale={locale}
          heading={t('members.title')}
          detail={error instanceof Error ? error.message : undefined}
        />
      </SectionFrame>
    );
  }

  return (
    <SectionFrame id="integrantes">
      <SectionHeading
        hideRule
        title={t('members.title')}
        description={t('members.description')}
        actionLabel={t('members.action')}
        actionHref={`/${locale}/integrantes`}
      />

      <ul className="mt-block grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {members.map((member) => (
          <li key={member.slug}>
            <a
              href={`/${locale}/integrantes/${member.slug}`}
              className="group/card focus-visible:outline-focus block focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <MemberPhoto
                member={member}
                zoom
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23vw"
              />
              <p className="font-display text-fg group-hover/card:text-accent-text ease-out-soft mt-4 text-2xl font-bold transition-colors duration-[var(--dur-2)]">
                {member.stageName}
              </p>
              <p className="text-fg-muted mt-1 text-sm">{member.position}</p>
              {member.koreanName ? (
                <p className="text-fg-subtle text-xs" lang="ko">
                  {member.koreanName}
                </p>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </SectionFrame>
  );
}

/**
 * Esqueleto de la sección.
 *
 * Reproduce la MISMA rejilla y las MISMAS proporciones que el contenido real:
 * cuatro retratos 3:4 con dos líneas debajo. Un esqueleto que no coincide con
 * lo que va a llegar produce un salto de maquetado en cuanto carga, que es
 * justo lo que un esqueleto existe para evitar.
 */
export async function MembersSectionSkeleton({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <SectionFrame id="integrantes">
      <SectionHeading hideRule title={t('members.title')} description={t('members.description')} />

      <ul className="mt-block grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index}>
            <Skeleton className="aspect-[3/4] h-auto w-full" />
            <Skeleton className="mt-4 h-7" width="70%" />
            <Skeleton className="mt-2 h-4" width="50%" />
          </li>
        ))}
      </ul>
    </SectionFrame>
  );
}
