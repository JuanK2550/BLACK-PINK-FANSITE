// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { GalleryGrid } from './gallery-grid';
import type { GalleryPhoto } from '../../lib/gallery';

/**
 * ============================================================================
 * LA GALERIA
 * ============================================================================
 * Lo que se prueba es lo que la LICENCIA exige y lo que el teclado necesita:
 * que el credito de cada foto nombre SU licencia, que el lightbox se abra, se
 * mueva con las flechas, cierre con Esc y devuelva el foco.
 * ============================================================================
 */

function foto(over: Partial<GalleryPhoto>): GalleryPhoto {
  return {
    id: 'a',
    archivo: '/galeria/a.jpg',
    width: 1400,
    height: 900,
    bytes: 100000,
    subject: 'grupo',
    subjects: ['grupo'],
    anio: 2019,
    fecha: '2019-01-01',
    autor: 'Autor A',
    licencia: 'CC BY 4.0',
    familia: 'CC BY',
    shareAlike: false,
    licenciaUrl: 'https://creativecommons.org/licenses/by/4.0',
    origen: 'https://commons.wikimedia.org/wiki/File:A.jpg',
    tituloCommons: 'File:A.jpg',
    descripcion: 'El grupo en el escenario',
    ...over,
  };
}

const FOTOS = [
  foto({}),
  foto({
    id: 'b',
    archivo: '/galeria/b.jpg',
    subject: 'lisa',
    subjects: ['lisa'],
    anio: 2022,
    fecha: '2022-01-01',
    autor: 'Autor B',
    licencia: 'CC BY-SA 4.0',
    familia: 'CC BY-SA',
    shareAlike: true,
    tituloCommons: 'File:B.jpg',
    descripcion: 'Lisa en un aeropuerto',
  }),
];

const LABELS: Record<string, string> = {
  all: 'Todas',
  allYears: 'Todos los años',
  grupo: 'El grupo',
  filterSubject: 'Filtrar por integrante',
  filterYear: 'Filtrar por año',
  count: '{n} fotografías',
  open: 'Abrir {titulo}',
  close: 'Cerrar',
  prev: 'Anterior',
  next: 'Siguiente',
  source: 'Ver en Commons',
  lightbox: 'Fotografía a tamaño completo',
  alt: '{quien}, fotografía',
  altYear: '{quien} en {ano}',
};

const pintar = () => render(<GalleryGrid photos={FOTOS} labels={LABELS} />);

describe('GalleryGrid', () => {
  it('el credito nombra la licencia DE CADA foto, no una generica', () => {
    // Un pie unico «CC BY» seria falso para las de CC BY-SA.
    pintar();
    expect(screen.getByText('© Autor A · CC BY 4.0')).toBeInTheDocument();
    expect(screen.getByText('© Autor B · CC BY-SA 4.0')).toBeInTheDocument();
  });

  it('el alt sale de la descripcion real, no de un texto inventado', () => {
    pintar();
    expect(screen.getByAltText('El grupo en 2019. El grupo en el escenario')).toBeInTheDocument();
  });

  it('los dos filtros son grupos de radio y salen de los datos', () => {
    pintar();
    const grupos = screen.getAllByRole('radiogroup');
    expect(grupos).toHaveLength(2);
    // Los anos son los que existen de verdad, de mas reciente a mas antiguo.
    expect(screen.getByRole('radio', { name: '2022' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2019' })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: '2020' })).not.toBeInTheDocument();
  });

  it('filtrar por integrante reduce lo que se ve y lo anuncia', async () => {
    const user = userEvent.setup();
    pintar();
    expect(screen.getByText('2 fotografías')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /LISA/ }));
    expect(screen.getByText('1 fotografías')).toBeInTheDocument();
    expect(screen.queryByAltText(/El grupo en 2019/)).not.toBeInTheDocument();
  });

  it('el lightbox abre, se mueve con las flechas y cierra con Esc', async () => {
    const user = userEvent.setup();
    pintar();

    await user.click(screen.getByRole('button', { name: 'Abrir A.jpg' }));
    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).getByText('1 / 2')).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    // Da la vuelta por el extremo: llegar al final y que la flecha deje de
    // responder se lee como que algo se ha roto.
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el lightbox devuelve el foco al boton que lo abrio', async () => {
    const user = userEvent.setup();
    pintar();

    const disparador = screen.getByRole('button', { name: 'Abrir A.jpg' });
    await user.click(disparador);
    await user.keyboard('{Escape}');

    expect(document.activeElement).toBe(disparador);
  });

  it('el lightbox trae la atribucion completa: licencia y fuente enlazadas', async () => {
    const user = userEvent.setup();
    pintar();
    await user.click(screen.getByRole('button', { name: 'Abrir A.jpg' }));

    const dialogo = screen.getByRole('dialog');
    const licencia = within(dialogo).getByRole('link', { name: 'CC BY 4.0' });
    expect(licencia).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0');
    expect(within(dialogo).getByRole('link', { name: 'Ver en Commons' })).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:A.jpg',
    );
  });
});
