// PINKY con sus gestos; un clic lanza uno.
'use client';

import { useReducedMotion } from 'framer-motion';
import { PinkyLion, type PinkyState } from './pinky-lion';
import { usePinkyGestures } from './use-pinky-gestures';

export interface PinkyStageProps {
  state: PinkyState;
  className?: string;
}

export function PinkyStage({ state, className }: PinkyStageProps) {
  const reduced = useReducedMotion() ?? false;
  const { gesture, poke } = usePinkyGestures(state, reduced);

  return (
    <span onClick={poke} className={className} style={{ display: 'block' }}>
      <PinkyLion
        state={state}
        gesture={gesture}
        reducedMotion={reduced}
        className="h-full w-full"
      />
    </span>
  );
}
