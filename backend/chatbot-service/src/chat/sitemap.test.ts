// Pruebas del mapa del sitio del chatbot.

import { describe, expect, it } from 'vitest';
import { splitAction } from './prompt';
import { NO_ACTION, resolveAction } from './sitemap';

describe('contrato de acciones', () => {
  const known = [
    { path: '/integrantes/rose', label: 'Ficha de ROSE' },
    { path: '/discografia/born-pink', label: 'Ficha de BORN PINK' },
  ];

  it('lleva a una seccion del mapa con el prefijo de idioma', () => {
    expect(resolveAction({ action: 'navigate', path: '/cronologia' }, 'es', known)).toEqual({
      action: 'navigate',
      path: '/es/cronologia',
      label: 'Ver cronologia',
    });
  });

  it('etiqueta en el idioma de la conversacion', () => {
    expect(resolveAction({ action: 'navigate', path: '/premios' }, 'ko', known)?.label).toBe(
      '수상 보기',
    );
  });

  it('acepta una ficha concreta solo si salio del contexto', () => {
    expect(resolveAction({ action: 'navigate', path: '/integrantes/rose' }, 'es', known)).toEqual({
      action: 'navigate',
      path: '/es/integrantes/rose',
      label: 'Ficha de ROSE',
    });
  });

  it('descarta una ruta inventada aunque suene razonable', () => {
    expect(
      resolveAction({ action: 'navigate', path: '/integrantes/jennie/discografia' }, 'es', known),
    ).toEqual(NO_ACTION);
  });

  it('descarta una ficha que no aparecio en el contexto', () => {
    expect(resolveAction({ action: 'navigate', path: '/discografia/inventado' }, 'es', [])).toEqual(
      NO_ACTION,
    );
  });

  it('tolera que el modelo ponga el prefijo de idioma por su cuenta', () => {
    expect(resolveAction({ action: 'navigate', path: '/es/premios' }, 'es', known)?.path).toBe(
      '/es/premios',
    );
  });

  it('NO existe play_track: el sitio no puede reproducir nada', () => {
    expect(
      resolveAction(
        { action: 'play_track', path: '/discografia/born-pink' } as {
          action: string;
          path: string;
        },
        'es',
        known,
      ),
    ).toEqual(NO_ACTION);
  });

  it('sin accion, none', () => {
    expect(resolveAction(null, 'es', known)).toEqual(NO_ACTION);
    expect(resolveAction({ action: 'none' }, 'es', known)).toEqual(NO_ACTION);
  });
});

describe('separacion del marcador', () => {
  it('saca la accion y deja el texto limpio', () => {
    const { visible, raw } = splitAction(
      'BORN PINK salio en 2022.\nACCION: {"action":"navigate","path":"/discografia/born-pink"}',
    );

    expect(visible).toBe('BORN PINK salio en 2022.');
    expect(raw).toEqual({ action: 'navigate', path: '/discografia/born-pink' });
  });

  it('sin marcador devuelve el texto entero', () => {
    expect(splitAction('Solo texto.')).toEqual({ visible: 'Solo texto.', raw: null });
  });

  it('un marcador ilegible no se lleva por delante la respuesta', () => {
    const { visible, raw } = splitAction('Respuesta util.\nACCION: {roto');
    expect(visible).toBe('Respuesta util.');
    expect(raw).toBeNull();
  });
});
