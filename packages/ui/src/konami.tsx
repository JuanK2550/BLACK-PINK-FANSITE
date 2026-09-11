'use client';

import { useEffect, useRef, useState } from 'react';
import { THEME_STORAGE_KEY, type Theme } from './controls';

/**
 * ============================================================================
 * EASTER EGG: EL CODIGO KONAMI
 * ============================================================================
 * ↑ ↑ ↓ ↓ ← → ← → B A enciende el MODO BLINK, que es el sistema de color con
 * la tinta invertida: el rosa pasa a ser el papel y el negro la tinta. Vive
 * en `theme.css` como un tema completo, no como un filtro encima, y sus pares
 * de contraste se comprueban en CI junto a los del tema oscuro y el claro.
 *
 * NO SE ESCUCHA DENTRO DE UN CAMPO DE TEXTO. Es la unica forma de que el
 * codigo no se dispare mientras alguien escribe en el chat de PINKY o se mueve
 * con las flechas por el buscador. Un easter egg que interrumpe una tarea deja
 * de ser un regalo.
 *
 * EL SEGUNDO KONAMI DEVUELVE EL TEMA ANTERIOR, y el boton de tema tambien
 * saca de aqui. Un modo del que no se sabe salir deja de tener gracia a los
 * diez segundos, y este cambia la pagina entera.
 *
 * SE GUARDA EN LA MISMA CLAVE QUE LOS OTROS TEMAS (`bp-theme`), asi que el
 * guion en linea de la cabecera lo restaura al recargar sin parpadeo. No hace
 * falta una segunda via de persistencia para un tercer tema.
 *
 * EL AVISO SE ANUNCIA, no solo se pinta: quien no ve la pantalla tiene que
 * enterarse de que el sitio ha cambiado de aspecto igual que quien la ve.
 * ============================================================================
 */

/** La secuencia, en minusculas y con los nombres de `KeyboardEvent.key`. */
const SEQUENCE = [
  'arrowup',
  'arrowup',
  'arrowdown',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'arrowleft',
  'arrowright',
  'b',
  'a',
] as const;

/** Cuanto se queda el aviso en pantalla. */
const NOTICE_MS = 3200;

export interface KonamiEasterEggProps {
  labels: {
    /** «Modo BLINK» */
    title: string;
    /** Como salir. */
    hint: string;
  };
}

function esCampoDeTexto(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function KonamiEasterEgg({ labels }: KonamiEasterEggProps) {
  const [notice, setNotice] = useState(false);
  const progress = useRef(0);
  /** El tema al que se vuelve si se repite el codigo. */
  const previous = useRef<Theme>('dark');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function apply(theme: string) {
      document.documentElement.dataset.theme = theme;
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Modo privado: el tema dura lo que la pestaña.
      }
    }

    function unlock() {
      const actual = document.documentElement.dataset.theme;

      if (actual === 'blink') {
        apply(previous.current);
        setNotice(false);
        return;
      }

      previous.current = actual === 'light' ? 'light' : 'dark';
      apply('blink');
      setNotice(true);
      clearTimeout(timer);
      timer = setTimeout(() => setNotice(false), NOTICE_MS);
    }

    function onKeyDown(event: KeyboardEvent) {
      // Ni dentro de un campo ni con un modificador: Ctrl+B es de alguien más.
      if (esCampoDeTexto(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();

      if (key === SEQUENCE[progress.current]) {
        progress.current += 1;
        if (progress.current === SEQUENCE.length) {
          progress.current = 0;
          unlock();
        }
        return;
      }

      /*
       * Al fallar se vuelve a empezar, pero contando esta tecla como posible
       * primer paso. Sin eso, «↑ ↑ ↑ ↓ ↓ …» no llegaria nunca: la tercera
       * flecha arriba rompe la cadena y descartaria tambien el arranque
       * bueno que ella misma es.
       */
      progress.current = key === SEQUENCE[0] ? 1 : 0;
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      /*
       * La region vive SIEMPRE, vacia cuando no hay nada que decir. Montarla
       * junto con el texto haria que el lector de pantalla no llegara a verla
       * aparecer y no anunciara nada.
       */
      aria-live="polite"
      className="px-gutter pointer-events-none fixed inset-x-0 bottom-6 z-[95] flex justify-center"
    >
      {notice ? (
        <p
          /*
           * Sin radio: es una superficie editorial, no un control. Con el
           * filete de siempre y el acento del modo -que aqui es negro-.
           */
          className="border-line-strong bg-overlay text-fg shadow-lift-2 bp-blink-notice border px-5 py-3 text-sm"
        >
          <span className="text-2xs text-accent-text block font-medium" data-uppercase>
            {labels.title}
          </span>
          <span className="text-fg-muted mt-1 block">{labels.hint}</span>
        </p>
      ) : null}
    </div>
  );
}
