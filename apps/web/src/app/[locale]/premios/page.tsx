import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@blackpink/types';
import { routing } from '../../../i18n/routing';
import { Container, EmptyState, Reveal } from '@blackpink/ui';
import { JsonLd } from '../../../components/json-ld';
import { PageHeader } from '../../../components/pages/page-header';
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

/**
 * ============================================================================
 * PREMIOS
 * ============================================================================
 * Agrupado por ano de CEREMONIA, de mas reciente a mas antiguo, porque es como
 * lo cuenta la fuente y como lo busca un lector: "que ganaron en 2020".
 *
 * DOS APOYOS DE LECTURA QUE NO SON DECORACION:
 *
 * 1. La nota del ano va ARRIBA. Gobierna como se lee cada fila de la pagina:
 *    sin ella, ver `Ddu-Du Ddu-Du` (2018) premiado en 2019 parece un error.
 *
 * 2. El glosario de bonsang y daesang va ABAJO. Esas palabras aparecen dentro
 *    del nombre de los premios, y un lector que no las conoce solo necesita la
 *    explicacion DESPUES de haberse topado con la primera. Arriba seria un
 *    peaje antes del contenido; abajo es una nota al pie.
 *
 * El estado (ganado / nominado) va en gris, no en rosa. Hoy todas las filas
 * son victorias: cuarenta etiquetas de acento seguidas convertirian la columna
 * en un bloque rosa y el acento dejaria de senalar nada. El rosa se queda en
 * el ano, que es lo que estructura la pagina.
 * ============================================================================
 */
export default async function AwardsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'AwardsPage' });
  const nav = await getTranslations({ locale, namespace: 'Nav' });
  const { items } = await getAwards({ locale, limit: 100 });

  // Agrupados por ano, de mas reciente a mas antiguo.
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
            {/*
             * El alcance se declara arriba, no en letra pequena al final. Las
             * victorias son TODAS; las nominaciones, no. Publicar dos
             * nominaciones sin decirlo insinuaria que el grupo solo perdio dos
             * veces, que es peor error que no listarlas.
             */}
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
                {/*
                 * Cuantos premios cayeron ese ano. Va en gris y pequeno: el ano
                 * es lo que estructura la pagina y el recuento lo acompana, no
                 * compite. Con plural real, porque 2024 tiene uno solo y "1
                 * premios" delata una interfaz traducida a medias.
                 */}
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
                      {/*
                       * Una nominacion se lee distinta ANTES de llegar a la
                       * etiqueta: el nombre va atenuado. Dos senales para el
                       * mismo hecho, ninguna en rosa; el acento no premia una
                       * derrota.
                       */}
                      <p
                        className={
                          award.won
                            ? 'text-fg text-pretty text-base'
                            : 'text-fg-muted text-pretty text-base'
                        }
                      >
                        {award.name}
                      </p>
                      {/* La obra premiada, cuando el premio va por una. */}
                      {award.work ? (
                        <p className="text-fg-subtle mt-0.5 text-pretty text-sm">
                          {t('forWork')} <cite className="not-italic">{award.work}</cite>
                        </p>
                      ) : null}
                    </div>
                    <p className="text-fg-muted text-sm">{award.organization}</p>
                    {/*
                      EL ESTADO SE DICE CON TONO, NO CON UNA CAPSULA.
                      Antes «Nominado» iba dentro de una capsula con filete y
                      `rounded-full`, y eso estaba mal por dos motivos.
                      El de sistema: aqui el radio es solo para lo que se pulsa
                      y esto no se pulsa; la estructura la hacen filetes de 1px,
                      no cajas cerradas. Es la misma correccion que en la
                      etiqueta de cancion principal del tracklist.
                      El de jerarquia, que era el peor: la caja hacia que el
                      resultado MENOR gritase mas. Una nominacion ya se lee
                      atenuada en el nombre del premio, asi que sumaba dos
                      senales, mientras que un premio ganado se quedaba en el
                      tono mas apagado de los dos. Ahora el ganado va mas claro
                      y la nominacion mas tenue, en la misma direccion que el
                      nombre de arriba.
                      Sigue sin haber rosa: son 42 premios y casi todos
                      ganados; tenirlos de acento inundaria la pagina y el rosa
                      dejaria de senalar nada.
                    */}
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
