import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@blackpink/types';

/**
 * ============================================================================
 * TARJETA OPEN GRAPH DEL RESULTADO DEL QUIZ
 * ============================================================================
 * `/api/og/quiz?score=8&total=10&locale=es` → una imagen de 1200×630.
 *
 * ES UNA RUTA Y NO UN `opengraph-image.tsx`, y no es capricho: el fichero
 * convencional no recibe los parámetros de consulta, y aquí la imagen ENTERA
 * depende de ellos. Con la ruta, `generateMetadata` de la página del quiz
 * apunta a esta URL con la puntuación que se comparte.
 *
 * CORRE EN NODE, no en el borde, porque lee la fuente del disco. La alternativa
 * habitual —descargar la tipografía de Google en cada petición— ata una imagen
 * estática a que un tercero esté disponible.
 *
 * LA FUENTE VA EN EL REPOSITORIO. `fonts/syne-800.ttf` es la misma Syne que usa
 * el sitio, bajo licencia SIL Open Font License 1.1, que permite
 * redistribuirla. Sin ella la tarjeta saldría con la sans del sistema, y una
 * tarjeta que no se parece al sitio no vale para compartir.
 *
 * TODO LO QUE VIENE DE LA URL SE ACOTA. Un `score` o un `total` arbitrarios
 * acabarían dibujados en una imagen que luego se cachea; se validan como
 * enteros dentro de rango y el idioma contra la lista del contrato.
 * ============================================================================
 */

export const runtime = 'nodejs';

/** Tokens del sistema, copiados a mano: aquí no hay CSS ni variables. */
const CANVAS = '#08070a';
const FG = '#ffffff';
const FG_SUBTLE = '#6e6579';
const ACCENT = '#ff2e88';

/**
 * El texto de la tarjeta, en los tres idiomas.
 *
 * `notice` NO es decoración: es el aviso de sitio no oficial, que el proyecto
 * exige visible en todas partes. Una tarjeta se comparte FUERA del sitio, que
 * es justo donde más falta hace, así que tiene que ir traducida como el resto.
 * Estaba en castellano en las tres y se veía en la coreana.
 */
const STRINGS: Record<Locale, { result: string; of: string; notice: string }> = {
  es: { result: 'Quiz · Resultado', of: 'aciertos de', notice: 'Sitio de fans no oficial' },
  en: { result: 'Quiz · Result', of: 'correct out of', notice: 'Unofficial fan site' },
  ko: { result: '퀴즈 · 결과', of: '문제 중 정답', notice: '비공식 팬 사이트' },
};

function clampInt(raw: string | null, max: number): number | null {
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0 || value > max) return null;
  return value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const total = clampInt(searchParams.get('total'), 50) ?? 10;
  const score = clampInt(searchParams.get('score'), total) ?? 0;

  const requested = searchParams.get('locale') as Locale | null;
  const locale: Locale =
    requested && SUPPORTED_LOCALES.includes(requested) ? requested : DEFAULT_LOCALE;

  const strings = STRINGS[locale];

  const syne = await readFile(
    path.join(process.cwd(), 'src', 'app', 'api', 'og', 'fonts', 'syne-800.ttf'),
  );

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: CANVAS,
        padding: '72px 80px',
        fontFamily: 'Syne',
      }}
    >
      {/* Filete de acento arriba: la misma firma que abre cada sección. */}
      <div style={{ display: 'flex', width: 160, height: 6, background: ACCENT }} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/*
            Ni mayúsculas ni tracking en coreano: el hangul no tiene caja alta,
            así que `toUpperCase` no haría nada y el espaciado extra solo
            separaría sílabas que deben ir juntas. Es la misma regla que
            `[data-uppercase]` aplica en el sitio.
          */}
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: FG_SUBTLE,
            letterSpacing: locale === 'ko' ? 0 : 2,
          }}
        >
          {locale === 'ko' ? strings.result : strings.result.toUpperCase()}
        </div>

        {/* La puntuación es el objeto de la tarjeta. El acento va solo en el
              número acertado; el total es contexto. */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 8 }}>
          <div style={{ display: 'flex', fontSize: 210, color: ACCENT, lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ display: 'flex', fontSize: 96, color: FG_SUBTLE, marginLeft: 16 }}>
            / {total}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 34, color: FG, marginTop: 20 }}>
          {locale === 'ko' ? `${total}${strings.of} ${score}` : `${score} ${strings.of} ${total}`}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', fontSize: 40, color: FG, letterSpacing: -1 }}>
          BLACK<span style={{ color: ACCENT }}>PINK</span>
        </div>
        {/* El aviso viaja en la tarjeta: se comparte fuera del sitio, que es
              justo donde más falta hace decir que no es oficial. */}
        <div style={{ display: 'flex', fontSize: 22, color: FG_SUBTLE }}>{strings.notice}</div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Syne', data: syne, weight: 800, style: 'normal' }],
    },
  );
}
