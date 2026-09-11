'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ============================================================================
 * GRABAR DEL MICROFONO
 * ============================================================================
 * AQUI SI HAY SENAL DE VERDAD, y esa es toda la diferencia con el reproductor
 * que se retiro en la Fase 8B. Aquel dibujaba un visualizador sobre un iframe
 * de Spotify del que no se podia leer nada: mostraba un estado *pedido*, no un
 * estado *real*. Este lee el `AnalyserNode` del propio micrófono, muestra a
 * muestra. Lo que se pinta es lo que entra por el microfono.
 *
 * TRES COSAS QUE NO SON OBVIAS:
 *
 * 1. EL CORTE A LOS 60 SEGUNDOS ES DEL CLIENTE Y DEL SERVIDOR, no de uno solo.
 *    Aqui evita mandar un audio que se va a rechazar; alla evita que alguien
 *    se salte el navegador. Ninguno de los dos sobra.
 *
 * 2. EL FLUJO SE CIERRA SIEMPRE, pase lo que pase. Una pista de micrófono que
 *    queda abierta deja el indicador de grabacion encendido en la pestana, y
 *    quien lo ve no piensa «se me ha olvidado parar»: piensa que el sitio le
 *    esta escuchando a escondidas.
 *
 * 3. EL FORMATO LO ELIGE EL NAVEGADOR, no nosotros. Chrome y Firefox dan
 *    `audio/webm;codecs=opus`; Safari da `audio/mp4`. Se pregunta con
 *    `isTypeSupported` en vez de imponer uno: imponer webm en Safari devuelve
 *    un blob vacio sin lanzar ningun error.
 * ============================================================================
 */

/** Candidatos por orden de preferencia. El servidor acepta los cinco. */
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];

export type RecorderState =
  'idle' | 'requesting' | 'recording' | 'denied' | 'unsupported' | 'error';

export interface UseRecorderOptions {
  maxSeconds: number;
  /** Se llama con el audio al parar. No se llama al cancelar. */
  onComplete: (blob: Blob) => void;
}

export interface UseRecorder {
  state: RecorderState;
  /** Segundos transcurridos, con un decimal. */
  elapsed: number;
  /**
   * Amplitudes de 0 a 1, las mas recientes al final. Es lo que dibuja la onda.
   */
  levels: number[];
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
}

export function useRecorder({ maxSeconds, onComplete }: UseRecorderOptions): UseRecorder {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  // Un `cancel` no debe entregar el audio. Se marca antes de parar, porque el
  // evento `stop` llega despues y no sabe por que se ha parado.
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  /** Suelta TODO: pistas, contexto de audio y bucle de dibujo. */
  const teardown = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (clockRef.current !== null) {
      clearInterval(clockRef.current);
      clockRef.current = null;
    }

    // Parar las pistas es lo que apaga el punto rojo de la pestana.
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;

    recorderRef.current = null;
  }, []);

  // Si el panel se cierra a mitad de una grabacion, el microfono se suelta.
  useEffect(() => teardown, [teardown]);

  const start = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setState('unsupported');
      return;
    }

    setState('requesting');
    cancelledRef.current = false;
    chunksRef.current = [];
    setLevels([]);
    setElapsed(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // Las tres ayudan de verdad a Whisper: menos eco y menos ruido de
        // fondo es menos texto inventado sobre el ruido.
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (error) {
      // `NotAllowedError` es que han dicho que no; el resto, que no hay
      // microfono o esta ocupado. Se distinguen porque el mensaje al visitante
      // es distinto: uno se arregla en los permisos y el otro no.
      const name = (error as { name?: string } | null)?.name;
      setState(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
      return;
    }

    streamRef.current = stream;

    const mimeType = MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate));

    let recorder: MediaRecorder;
    try {
      // Sin `mimeType` si ninguno cuela: el navegador elige el suyo, y el
      // servidor lo reconocera por los bytes de todas formas.
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      teardown();
      setState('error');
      return;
    }

    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || 'audio/webm',
      });
      chunksRef.current = [];
      teardown();
      setState('idle');

      // Al cancelar, el audio se descarta aqui mismo y no llega a salir del
      // navegador.
      if (!cancelledRef.current && blob.size > 0) onCompleteRef.current(blob);
    };

    /* ------------------------------------------------ medidor de nivel --- */

    const AudioCtor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (AudioCtor) {
      const context = new AudioCtor();
      audioCtxRef.current = context;

      /*
       * `resume()` NO SOBRA, y esto se descubrio viendo la onda plana.
       *
       * Un `AudioContext` nace suspendido si no se crea dentro de un gesto del
       * usuario, y aqui se crea DESPUES de `await getUserMedia(...)`: ese await
       * rompe la cadena del gesto en cuanto el navegador tarda en resolver el
       * permiso. Suspendido, el analizador lee ceros y la onda sale plana con
       * un microfono perfectamente sano.
       *
       * Y no falla ruidosamente: la grabacion funciona, el audio se transcribe
       * bien, y lo unico que pasa es que la barra no se mueve. Que es el peor
       * modo de fallo posible, porque parece un problema del microfono.
       */
      void context.resume().catch(() => undefined);

      const analyser = context.createAnalyser();
      // 512 da 256 muestras por lectura: suficiente para una media estable y
      // barato de recorrer sesenta veces por segundo.
      analyser.fftSize = 512;
      // Suaviza el salto entre lecturas; sin esto la onda tiembla.
      analyser.smoothingTimeConstant = 0.6;
      context.createMediaStreamSource(stream).connect(analyser);

      const buffer = new Uint8Array(analyser.fftSize);

      const tick = () => {
        analyser.getByteTimeDomainData(buffer);

        // RMS sobre la forma de onda, no el pico: el pico salta con cualquier
        // golpe y la barra parece epileptica. La media cuadratica sigue al
        // volumen de la voz.
        let sum = 0;
        for (const sample of buffer) {
          const centred = (sample - 128) / 128;
          sum += centred * centred;
        }
        const rms = Math.sqrt(sum / buffer.length);

        // x3.2 porque una voz normal a un palmo del microfono da un RMS de
        // 0.1-0.3: sin escalar, la onda seria una linea plana.
        const level = Math.min(1, rms * 3.2);

        setLevels((previous) => {
          const next = [...previous, level];
          // Solo se conserva lo que cabe en la barra.
          return next.length > 96 ? next.slice(next.length - 96) : next;
        });

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }

    /*
     * EL RELOJ Y EL CORTE VAN EN UN `setInterval`, NO EN EL BUCLE DE DIBUJO.
     *
     * Estaban dentro del `requestAnimationFrame` y se vio el fallo mirandolo:
     * rAF SE PARA EN SECO cuando la pestana deja de pintarse -otra pestana al
     * frente, la ventana minimizada, el movil bloqueado-. Medido: cero
     * fotogramas en 1.2 segundos con la ventana detras.
     *
     * Consecuencia con el reloj ahi dentro: alguien empieza a grabar, cambia
     * de pestana, y el cronometro se congela y EL CORTE A LOS 60 SEGUNDOS NO
     * LLEGA A DISPARARSE NUNCA. El `MediaRecorder` sigue grabando -ese no se
     * para-, asi que el microfono se queda abierto indefinidamente y sin nada
     * en pantalla que lo diga. Es un fallo de privacidad, no de precision.
     *
     * `setInterval` si corre en segundo plano. Los navegadores lo estrangulan
     * a una vez por segundo, que para un limite de sesenta sobra.
     *
     * La ONDA si se queda en rAF, y ahi esta bien: si nadie mira la pantalla,
     * no hay nada que dibujar.
     */
    startedAtRef.current = Date.now();

    clockRef.current = setInterval(() => {
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(Math.round(seconds * 10) / 10);

      if (seconds >= maxSeconds && recorderRef.current?.state === 'recording') {
        // Llegar al limite ENTREGA lo grabado, no lo tira: `stop` dispara
        // `onstop`, que es quien llama a `onComplete`.
        recorderRef.current.stop();
      }
    }, 100);

    recorder.start();
    setState('recording');
  }, [maxSeconds, teardown]);

  const stop = useCallback(() => {
    cancelledRef.current = false;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    } else {
      teardown();
      setState('idle');
    }
  }, [teardown]);

  return { state, elapsed, levels, start, stop, cancel };
}
