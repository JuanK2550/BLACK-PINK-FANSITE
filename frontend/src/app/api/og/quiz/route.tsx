// Imagen para compartir el resultado del quiz en redes.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@blackpink/types';

export const runtime = 'nodejs';

const CANVAS = '#08070a';
const FG = '#ffffff';
const FG_SUBTLE = '#6e6579';
const ACCENT = '#ff2e88';

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
      <div style={{ display: 'flex', width: 160, height: 6, background: ACCENT }} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
