// Graba audio del micrófono con límite de tiempo.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  onComplete: (blob: Blob) => void;
}

export interface UseRecorder {
  state: RecorderState;
  elapsed: number;
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
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const teardown = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (clockRef.current !== null) {
      clearInterval(clockRef.current);
      clockRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;

    recorderRef.current = null;
  }, []);

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
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (error) {
      const name = (error as { name?: string } | null)?.name;
      setState(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error');
      return;
    }

    streamRef.current = stream;

    const mimeType = MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate));

    let recorder: MediaRecorder;
    try {
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

      if (!cancelledRef.current && blob.size > 0) onCompleteRef.current(blob);
    };

    const AudioCtor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (AudioCtor) {
      const context = new AudioCtor();
      audioCtxRef.current = context;

      // Se crea fuera de un gesto del usuario y nace suspendido: sin resume() la onda sale plana.
      void context.resume().catch(() => undefined);

      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      context.createMediaStreamSource(stream).connect(analyser);

      const buffer = new Uint8Array(analyser.fftSize);

      const tick = () => {
        analyser.getByteTimeDomainData(buffer);

        let sum = 0;
        for (const sample of buffer) {
          const centred = (sample - 128) / 128;
          sum += centred * centred;
        }
        const rms = Math.sqrt(sum / buffer.length);

        const level = Math.min(1, rms * 3.2);

        setLevels((previous) => {
          const next = [...previous, level];
          return next.length > 96 ? next.slice(next.length - 96) : next;
        });

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }

    startedAtRef.current = Date.now();

    // setInterval y no requestAnimationFrame: rAF se para con la pestaña oculta y el corte de 60 s no llegaría.
    clockRef.current = setInterval(() => {
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(Math.round(seconds * 10) / 10);

      if (seconds >= maxSeconds && recorderRef.current?.state === 'recording') {
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
