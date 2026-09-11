import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { Container, Reveal } from '@blackpink/ui';
import { routing } from '../../../i18n/routing';
import { JsonLd } from '../../../components/json-ld';
import { MemberPhoto } from '../../../components/member-photo';
import { PageHeader } from '../../../components/pages/page-header';
import { getMembers } from '../../../lib/api';
import { getGalleryPhotos } from '../../../lib/gallery';
import { formatDate } from '../../../lib/format';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '../../../lib/seo';

const PATH = '/creditos';

/**
 * ============================================================================
 * CRÉDITOS DE LAS IMÁGENES  ·  /[locale]/creditos
 * ============================================================================
 * ESTA PÁGINA ES UNA OBLIGACIÓN, no una cortesía. Las cuatro fotografías de
 * las integrantes están bajo CC BY 3.0, y esa licencia exige cuatro cosas:
 * nombrar al autor, enlazar la licencia, enlazar la fuente e **indicar si la
 * obra se ha modificado**. Aquí están las cuatro.
 *
 * SE GENERA DESDE LA API, no de una lista escrita a mano. Una lista a mano se
 * queda desactualizada el día que alguien cambia una foto, y ese día el sitio
 * pasa a atribuir mal —que es peor que no atribuir—. Como el crédito viaja con
 * la foto en el mismo registro, no puede desincronizarse.
 *
 * SOBRE EL COPYLEFT: CC BY 3.0 **no** lleva la cláusula ShareAlike. No obliga
 * a publicar el resto del sitio bajo la misma licencia ni a liberar el código.
 * Permite además el uso comercial y la adaptación —reescalar y recortar lo
 * son—, siempre que se indiquen. Está comprobado contra el texto de la
 * licencia y escrito en la propia página para que no haya que fiarse de un
 * comentario.
 * ============================================================================
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'CreditsPage' });
  return buildMetadata({ title: t('title'), description: t('lead'), path: PATH, locale });
}

export default async function CreditsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, nav] = await Promise.all([
    getTranslations({ locale, namespace: 'CreditsPage' }),
    getTranslations({ locale, namespace: 'Nav' }),
  ]);

  const members = await getMembers({ locale }).catch(() => []);
  const credited = members.filter((member) => member.imageUrl && member.imageAuthor);
  const gallery = getGalleryPhotos();

  return (
    <>
      <JsonLd
        data={webPageJsonLd({ name: t('title'), description: t('lead'), path: PATH, locale })}
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
        description={t('lead')}
        aside={`${credited.length + gallery.length} · CC`}
      />

      <Container width="wide" className="pb-section">
        <div className="max-w-prose">
          {/* --- Qué permite la licencia, y qué no ----------------------------
            Escrito en la página y no solo en un comentario del código: quien
            reutilice algo de aquí necesita poder leerlo sin abrir el repo. */}
          <section className="border-line border-t pt-8">
            <h2 className="font-display text-fg text-xl font-bold">{t('licenceHeading')}</h2>
            <p className="text-fg-muted mt-3 text-pretty leading-relaxed">{t('licenceBody')}</p>
          </section>

          <section className="border-line mt-10 border-t pt-8">
            <h2 className="font-display text-fg text-xl font-bold">{t('changesHeading')}</h2>
            <p className="text-fg-muted mt-3 text-pretty leading-relaxed">{t('changesBody')}</p>
          </section>

          {/* --- Las fichas, una por foto ------------------------------------ */}
          {credited.length === 0 ? (
            <p className="text-fg-muted mt-10">{t('empty')}</p>
          ) : (
            <ul className="mt-10 flex flex-col gap-8">
              {credited.map((member, index) => (
                <Reveal as="li" key={member.slug} delay={index * 0.05}>
                  <article className="border-line flex gap-5 border-t pt-8">
                    <div className="w-24 shrink-0 sm:w-32">
                      {/* Sin crédito superpuesto: aquí el crédito ES el texto de
                        al lado, y repetirlo encima de la miniatura sería
                        decirlo dos veces en el mismo palmo. */}
                      <MemberPhoto member={member} hideCredit sizes="128px" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-fg text-lg font-bold">
                        {t('photoOf', { name: member.stageName })}
                      </h3>

                      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                        <dt className="text-fg-subtle">{t('author')}</dt>
                        <dd className="text-fg">{member.imageAuthor}</dd>

                        <dt className="text-fg-subtle">{t('licence')}</dt>
                        <dd>
                          {member.imageLicenseUrl ? (
                            <a
                              href={member.imageLicenseUrl}
                              target="_blank"
                              rel="license noopener noreferrer"
                              className="text-accent-text hover:text-accent-hover focus-visible:outline-focus underline underline-offset-4 focus-visible:outline-2"
                            >
                              {member.imageLicense}
                            </a>
                          ) : (
                            <span className="text-fg">{member.imageLicense}</span>
                          )}
                        </dd>

                        {member.imageDate ? (
                          <>
                            <dt className="text-fg-subtle">{t('date')}</dt>
                            <dd className="text-fg">
                              <time dateTime={member.imageDate} data-numeric>
                                {formatDate(member.imageDate, locale)}
                              </time>
                            </dd>
                          </>
                        ) : null}
                      </dl>

                      {member.imageSource ? (
                        <p className="text-fg-subtle mt-3 text-xs leading-relaxed">
                          {/*
                          `imageSource` trae la URL y, detrás, la nota de qué se
                          cambió respecto al original. Se separa por el primer
                          espacio: lo primero es el enlace, el resto es la nota.
                        */}
                          <a
                            href={member.imageSource.split(' ')[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-text hover:text-accent-hover focus-visible:outline-focus underline underline-offset-4 focus-visible:outline-2"
                          >
                            {t('viewSource')}
                          </a>
                          <span className="ml-2">
                            {member.imageSource.split(' ').slice(1).join(' ')}
                          </span>
                        </p>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              ))}
            </ul>
          )}

          {/* --- La galeria -------------------------------------------------
            SESENTA CREDITOS, EN LISTA Y NO EN FICHAS. Las cuatro fotos de las
            integrantes llevan ficha porque cada una es una decision; estas son
            un acopio, y sesenta fichas convertirian la pagina en un catalogo
            imposible de leer. Lo que la licencia exige -autor, licencia
            enlazada y fuente enlazada- esta en las tres.

            Y SALE DEL MISMO FICHERO QUE LA GALERIA, que es lo que impide que
            una foto se publique aqui con un autor y alli con otro. */}
          <section className="border-line mt-10 border-t pt-8">
            <h2 className="font-display text-fg text-xl font-bold">{t('galleryHeading')}</h2>
            <p className="text-fg-muted mt-3 text-pretty leading-relaxed">{t('galleryBody')}</p>
            <p className="text-fg-muted mt-4 text-pretty leading-relaxed">
              {t('galleryShareAlike')}
            </p>

            <p className="text-fg-subtle text-2xs mt-6" data-numeric data-uppercase>
              {t('galleryCount', { n: gallery.length })}
            </p>

            <ul className="mt-4 flex flex-col">
              {gallery.map((foto) => (
                <li
                  key={foto.id}
                  className="border-line flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t py-3 text-sm"
                >
                  <span className="text-fg">© {foto.autor}</span>
                  {foto.licenciaUrl ? (
                    <a
                      href={foto.licenciaUrl}
                      target="_blank"
                      rel="license noopener noreferrer"
                      className="text-accent-text hover:text-accent-hover focus-visible:outline-focus underline underline-offset-4 focus-visible:outline-2"
                    >
                      {foto.licencia}
                    </a>
                  ) : (
                    <span className="text-fg-muted">{foto.licencia}</span>
                  )}
                  <a
                    href={foto.origen}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg-subtle hover:text-accent-text focus-visible:outline-focus ml-auto truncate text-xs underline underline-offset-4 focus-visible:outline-2"
                  >
                    {foto.tituloCommons.replace(/^File:/, '')}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-line mt-10 border-t pt-8">
            <h2 className="font-display text-fg text-xl font-bold">{t('otherHeading')}</h2>
            <p className="text-fg-muted mt-3 text-pretty leading-relaxed">{t('otherBody')}</p>
          </section>
        </div>
      </Container>
    </>
  );
}
