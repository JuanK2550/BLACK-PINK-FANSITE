// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { MemberDetail } from '@blackpink/types';
import { MemberCompare } from './member-compare';

/**
 * ============================================================================
 * EL COMPARADOR
 * ============================================================================
 * Las cuatro decisiones que lo definen, y ninguna es cosmética:
 *
 *   - elegir la que ya está enfrente las INTERCAMBIA en vez de bloquearse,
 *   - una fila vacía en los dos lados DESAPARECE, y en uno solo se marca con
 *     una raya para que las columnas sigan alineadas,
 *   - cada valor lleva el nombre de su integrante OCULTO, porque sin la
 *     cabecera «Kim Ji-soo, Roseanne Park» no dice cuál es cuál,
 *   - la diferencia de edad es una resta entre fechas contrastadas y se dice
 *     una sola vez, no como marca de «ganadora» en la fila.
 * ============================================================================
 */

function miembro(over: Partial<MemberDetail>): MemberDetail {
  return {
    slug: 'x',
    stageName: 'X',
    fullName: 'Nombre X',
    koreanName: '엑스',
    position: 'Vocalista',
    nationality: 'Corea del Sur',
    birthDate: '1996-01-01',
    colorAccent: '#ff2e88',
    imageUrl: null,
    imageWidth: null,
    imageHeight: null,
    imageAuthor: null,
    imageLicense: null,
    imageLicenseUrl: null,
    imageSource: null,
    imageDate: null,
    imageFocus: null,
    imageAlt: null,
    verified: true,
    nickname: null,
    bio: null,
    description: null,
    socials: null,
    soloWorks: [],
    trivia: [],
    timeline: [],
    ...over,
  } as MemberDetail;
}

const JISOO = miembro({
  slug: 'jisoo',
  stageName: 'JISOO',
  fullName: 'Kim Ji-soo',
  koreanName: '김지수',
  birthDate: '1995-01-03',
});

const ROSE = miembro({
  slug: 'rose',
  stageName: 'ROSÉ',
  fullName: 'Roseanne Park',
  koreanName: '박채영',
  birthDate: '1997-02-11',
  nationality: 'Nueva Zelanda',
  position: 'Vocalista principal',
});

const LABELS: Record<string, string> = {
  slotA: 'Primera',
  slotB: 'Segunda',
  swap: 'Intercambiar',
  realName: 'Nombre real',
  koreanName: 'Nombre coreano',
  birthDate: 'Fecha de nacimiento',
  nationality: 'Nacionalidad',
  position: 'Posición',
  soloCount: 'Obras en solitario',
  firstSolo: 'Primera obra en solitario',
  ageGap: '{older} es {days} días mayor que {younger}.',
  ageGapOne: '{older} es 1 día mayor que {younger}.',
  sameDay: 'Nacieron el mismo día.',
};

function pintar(miembros = [JISOO, ROSE]) {
  return render(
    <MemberCompare
      members={miembros}
      locale="es"
      initialA={miembros[0]!.slug}
      initialB={miembros[1]!.slug}
      labels={LABELS}
      creditsHref="/es/creditos"
    />,
  );
}

describe('MemberCompare', () => {
  it('pinta las dos columnas con sus datos', () => {
    pintar();
    expect(screen.getByText('Kim Ji-soo')).toBeInTheDocument();
    expect(screen.getByText('Roseanne Park')).toBeInTheDocument();
  });

  it('los selectores son un grupo de radio: aquí elegir no compromete', () => {
    // Al revés que el quiz, donde pulsar ES responder y por eso son botones.
    pintar();
    expect(screen.getAllByRole('radiogroup')).toHaveLength(2);
  });

  it('cada valor lleva el nombre de su integrante para el lector de pantalla', () => {
    // Sin esto, «Nombre real: Kim Ji-soo, Roseanne Park» no dice cuál es cuál,
    // y una comparación en la que no se sabe de quién es cada dato no compara.
    const { container } = pintar();
    const ocultos = [...container.querySelectorAll('dd .sr-only')].map((n) => n.textContent);
    expect(ocultos.filter((t) => t?.includes('JISOO')).length).toBeGreaterThan(0);
    expect(ocultos.filter((t) => t?.includes('ROSÉ')).length).toBeGreaterThan(0);
  });

  it('dice la diferencia de edad UNA vez, en texto, sin coronar a nadie', () => {
    pintar();
    // Del 3-1-1995 al 11-2-1997 hay 770 días.
    expect(screen.getByText('JISOO es 770 días mayor que ROSÉ.')).toBeInTheDocument();
  });

  it('una fila vacía en los DOS lados desaparece', () => {
    // «Primera obra en solitario» no existe si ninguna tiene obras.
    pintar();
    expect(screen.queryByText('Primera obra en solitario')).not.toBeInTheDocument();
  });

  it('una fila vacía en UN lado se marca con una raya y la fila se queda', () => {
    // La fila tiene que existir o las dos columnas dejan de estar alineadas.
    const sinCoreano = miembro({ ...ROSE, koreanName: null });
    pintar([JISOO, sinCoreano]);
    expect(screen.getByText('Nombre coreano')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('elegir la que ya está enfrente las INTERCAMBIA', async () => {
    // Un control deshabilitado obliga a entender por qué antes de poder
    // actuar; el intercambio hace lo único que esa elección puede querer decir.
    const user = userEvent.setup();
    const { container } = pintar();

    const [grupoA] = screen.getAllByRole('radiogroup');
    await user.click(within(grupoA!).getByRole('radio', { name: /ROSÉ/ }));

    const cabeceras = [...container.querySelectorAll('h2, .font-display')].map(
      (n) => n.textContent,
    );
    expect(cabeceras.join(' ')).toContain('ROSÉ');
    // Y la otra columna se ha quedado con JISOO en vez de duplicarse.
    expect(screen.getByText('Kim Ji-soo')).toBeInTheDocument();
    expect(screen.getByText('Roseanne Park')).toBeInTheDocument();
  });

  it('el botón de intercambiar tiene nombre accesible', () => {
    pintar();
    expect(screen.getByRole('button', { name: 'Intercambiar' })).toBeInTheDocument();
  });
});
