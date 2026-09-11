import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_KR, Syne } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { AmbientBackground, KonamiEasterEgg } from '@blackpink/ui';
import { QueryProvider } from '../../components/query-provider';
import { ChatWidget } from '../../components/chat/chat-widget';
import { SiteChrome } from '../../components/site-chrome';
import { HydrationMark } from '../../components/hydration-mark';
import { routing } from '../../i18n/routing';
import { getAlbums, getMembers } from '../../lib/api';
import { SITE_URL } from '../../lib/seo';
import '../../styles/globals.css';

/*
 * TIPOGRAFIA
 * Las tres familias se auto-hospedan en el build: cero peticiones a Google en
 * tiempo de ejecucion, cero cambio de fuente visible al cargar.
 * Syne no tiene glifos hangul, por eso Noto Sans KR es a la vez la familia
 * coreana y el respaldo de las otras dos.
 */
const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-noto-kr',
  display: 'swap',
});

/** Las tres versiones se generan en el build. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Footer' });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: 'BLACKPINK Fansite', template: '%s | BLACKPINK Fansite' },
    description: t('tagline'),
    robots: { index: true, follow: true },
    /*
     * hreflang. Le dice a un buscador que estas tres URL son la MISMA pagina
     * en tres idiomas, y no tres paginas distintas compitiendo entre si.
     * `x-default` marca a donde mandar a quien no encaje en ninguno.
     */
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ...Object.fromEntries(routing.locales.map((code) => [code, `${SITE_URL}/${code}`])),
        'x-default': `${SITE_URL}/${routing.defaultLocale}`,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08070a' },
    { media: '(prefers-color-scheme: light)', color: '#08070a' },
  ],
  colorScheme: 'dark light',
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('bp-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}})()`;

const DIRECTION_CONTRACT = `<!--
IMPECCABLE DIRECTION CONTRACT | bp-editorial-cover

THESIS: Un fan site que se compone como una revista de moda impresa en
negativo, no como un panel de neon. Rechaza la rejilla de tarjetas identicas
con degradado rosa que es el defecto de la categoria.

OWN-WORLD: Negro profundo #08070a con matiz violaceo, rosa #ff2e88 usado como
tinta escasa, rosa pastel #ffc2da para el dato secundario. Syne extrabold para
la display, Inter para el cuerpo, Noto Sans KR para el hangul. Superficies
rectas (radio 0) y controles redondeados: esa tension es la firma. Filetes de
1px en vez de cajas. Sombras con desplazamiento, nunca halos planos.

STORY: El visitante llega a comprobar un dato, entiende en un viewport que
esto es un archivo cuidado y no un blog, y encuentra la seccion que buscaba
en el sumario sin hacer scroll.

FIRST VIEWPORT: Portada a pantalla completa. Wordmark apilado BLACK/PINK a
13vw sangrando hasta el canal, entrada de 520ms con 90ms entre las dos
mitades. Debajo, entradilla a 46ch y dos acciones; al pie, el sumario del
sitio como indice de revista. Capa de imagen preparada y vacia.

FORM: Portada editorial. Primera de la lista ordenada por resonancia.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.
-->`;

/**
 * Namespaces que necesitan los componentes de cliente: el armazon del sitio
 * (header, buscador, pie) y los tres exploradores interactivos.
 * El resto se resuelve en el servidor y llega como HTML.
 */
const CLIENT_NAMESPACES = [
  'Nav',
  'Header',
  'Search',
  'Footer',
  'A11y',
  'Empty',
  // error.tsx es de cliente y vive dentro de este layout.
  'Errors',
  'Chat',
  'DiscographyPage',
  'AlbumTypes',
  'TimelinePage',
  'TimelineCategories',
  'TriviaPage',
  'TriviaCategories',
] as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Un idioma que no existe es un 404, no una pagina en espanol con la URL
  // equivocada: la URL prometia coreano y no lo es.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Habilita el renderizado estatico: sin esto, cualquier pagina que use
  // traducciones se vuelve dinamica y se pierde el prerenderizado.
  setRequestLocale(locale);

  /*
   * Los datos de los mega-menus se cargan aqui, en el servidor, YA EN EL
   * IDIOMA DE LA RUTA. Si un servicio esta caido el sitio no se cae con el:
   * el header se pinta con los menus vacios y el resto sigue funcionando.
   */
  const egg = await getTranslations({ locale, namespace: 'EasterEgg' });

  const messages = await getMessages({ locale });
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.filter((key) => key in messages).map((key) => [key, messages[key]]),
  );

  const [members, albums] = await Promise.all([
    getMembers({ locale }).catch(() => []),
    getAlbums({ locale, limit: 6 })
      .then((page) => page.items)
      .catch(() => []),
  ]);

  return (
    <html
      lang={locale}
      data-theme="dark"
      suppressHydrationWarning
      className={`${syne.variable} ${inter.variable} ${notoSansKr.variable}`}
    >
      <body className="min-h-dvh">
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />

        <AmbientBackground />

        {/*
         * Solo viajan al navegador los namespaces que algun componente de
         * CLIENTE necesita de verdad. Sin este filtro, next-intl envia el
         * diccionario entero -158 cadenas, incluidas las de paginas que este
         * visitante quiza no abra nunca- en el bundle de cada pagina.
         */}
        <NextIntlClientProvider messages={clientMessages}>
          <QueryProvider>
            <SiteChrome members={members} albums={albums}>
              {children}
            </SiteChrome>

            {/*
             * En el layout, no en una pagina: el App Router lo conserva entre
             * rutas, asi que la conversacion sobrevive a la navegacion. A
             * diferencia del reproductor retirado en la Fase 8B, aqui el estado
             * es nuestro y si se puede sostener sin mentir.
             */}
            <ChatWidget />

            {/*
             * El easter egg vive en el LAYOUT: el codigo se puede teclear
             * desde cualquier pagina, y si viviera en una sola habria que
             * saber cual. Sus etiquetas llegan como props para no meter otro
             * namespace en `CLIENT_NAMESPACES`, que viajaria en el bundle de
             * todas las paginas por dos frases.
             */}
            <KonamiEasterEgg labels={{ title: egg('blinkTitle'), hint: egg('blinkHint') }} />
            <HydrationMark />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
