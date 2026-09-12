// Dibujo SVG de PINKY, el león mascota.
'use client';

import { useId } from 'react';

export type PinkyState = 'idle' | 'thinking' | 'speaking' | 'listening' | 'greeting';

export interface PinkyLionProps {
  state?: PinkyState;
  reducedMotion?: boolean;
  gesture?: PinkyGesture | null;
  className?: string;
}

export type PinkyGesture =
  'stretch' | 'scratch' | 'chase-tail' | 'shake-mane' | 'hop' | 'sit-look' | 'peek' | 'roar';

export const PINKY_GESTURES: PinkyGesture[] = [
  'stretch',
  'scratch',
  'chase-tail',
  'shake-mane',
  'hop',
  'sit-look',
  'peek',
  'roar',
];

const RIM = { stroke: 'var(--bp-pinky-line)', strokeWidth: 2 } as const;

const MANE: [number, number, number][] = [
  [100, 20, 24],
  [125, 25, 18],
  [145, 40, 22],
  [156, 61, 16],
  [160, 84, 20],
  [153, 104, 17],
  [138, 118, 15],
  [120, 126, 13],
  [100, 129, 14],
  [80, 126, 13],
  [62, 118, 15],
  [47, 104, 17],
  [40, 84, 20],
  [44, 61, 16],
  [55, 40, 23],
  [75, 25, 19],
];

export function PinkyLion({
  state = 'idle',
  reducedMotion = false,
  gesture = null,
  className,
}: PinkyLionProps) {
  const uid = useId().replace(/:/g, '');
  const halo = `pinky-halo-${uid}`;
  const belly = `pinky-belly-${uid}`;
  const eyeClip = `pinky-eye-${uid}`;

  return (
    <div className={className} aria-hidden>
      <svg
        viewBox="14 -16 172 214"
        className="bp-ln h-full w-full"
        data-state={state}
        data-gesture={gesture ?? undefined}
        data-reduced={reducedMotion ? 'true' : 'false'}
        role="presentation"
      >
        <defs>
          <radialGradient id={halo} cx="50%" cy="46%" r="52%">
            <stop offset="0%" stopColor="var(--bp-accent)" stopOpacity="0.18" />
            <stop offset="62%" stopColor="var(--bp-accent)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--bp-accent)" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={belly} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bp-pinky-cream)" />
            <stop offset="100%" stopColor="var(--bp-pinky-belly)" />
          </linearGradient>

          <clipPath id={`${eyeClip}-l`}>
            <ellipse cx="85" cy="74" rx="11" ry="12.5" />
          </clipPath>
          <clipPath id={`${eyeClip}-r`}>
            <ellipse cx="115" cy="74" rx="11" ry="12.5" />
          </clipPath>
        </defs>

        <circle cx="100" cy="90" r="82" fill={`url(#${halo})`} />

        <g className="bp-ln-lean">
          <g className="bp-ln-legs">
            <ellipse cx="84" cy="180" rx="14" ry="9" fill="var(--bp-pinky-fur)" {...RIM} />
            <ellipse cx="116" cy="180" rx="14" ry="9" fill="var(--bp-pinky-fur)" {...RIM} />
            <ellipse cx="84" cy="181" rx="6.5" ry="4" fill="var(--bp-pinky-cream)" />
            <ellipse cx="116" cy="181" rx="6.5" ry="4" fill="var(--bp-pinky-cream)" />
          </g>

          <g className="bp-ln-breath">
            <g className="bp-ln-beat">
              <g className="bp-ln-tail-pose">
                <g className="bp-ln-tail-loop">
                  <path
                    d="M128 164C156 166 170 150 168 132"
                    fill="none"
                    stroke="var(--bp-pinky-line)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path
                    d="M128 164C156 166 170 150 168 132"
                    fill="none"
                    stroke="var(--bp-pinky-fur)"
                    strokeWidth="13"
                    strokeLinecap="round"
                  />
                  <g className="bp-ln-tuft">
                    <circle cx="166" cy="123" r="13" fill="var(--bp-pinky-mane)" {...RIM} />
                    <circle cx="157" cy="115" r="9" fill="var(--bp-pinky-mane)" {...RIM} />
                    <circle cx="175" cy="114" r="8" fill="var(--bp-pinky-mane)" {...RIM} />
                    <circle cx="166" cy="119" r="7" fill="var(--bp-accent)" opacity="0.9" />
                    <circle cx="157" cy="113" r="3.4" fill="var(--bp-accent)" opacity="0.55" />
                  </g>
                </g>
              </g>

              <ellipse cx="100" cy="152" rx="32" ry="28" fill="var(--bp-pinky-fur)" {...RIM} />
              <ellipse
                cx="100"
                cy="165"
                rx="28"
                ry="14"
                fill="var(--bp-pinky-fur-sh)"
                opacity="0.55"
              />
              <ellipse cx="100" cy="160" rx="17" ry="16" fill={`url(#${belly})`} />

              <g className="bp-ln-arm-r-pose">
                <path
                  d="M126 140C138 148 144 160 142 172"
                  fill="none"
                  stroke="var(--bp-pinky-line)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M126 140C138 148 144 160 142 172"
                  fill="none"
                  stroke="var(--bp-pinky-fur)"
                  strokeWidth="13"
                  strokeLinecap="round"
                />
                <circle cx="142" cy="172" r="9.5" fill="var(--bp-pinky-fur)" {...RIM} />
                <circle cx="142" cy="173" r="5.5" fill="var(--bp-pinky-cream)" />
              </g>

              <g className="bp-ln-head-pose">
                <g className="bp-ln-head-loop">
                  <g className="bp-ln-mane">
                    {MANE.map(([cx, cy, r], index) => {
                      const dx = (cx - 100) * 0.055;
                      const dy = (cy - 79) * 0.055;
                      return (
                        <circle
                          key={`tip-${index}`}
                          cx={cx + dx}
                          cy={cy + dy}
                          r={r}
                          fill="var(--bp-accent)"
                          opacity="0.22"
                        />
                      );
                    })}

                    <ellipse cx="100" cy="76" rx="54" ry="50" fill="var(--bp-pinky-mane)" />

                    {MANE.map(([cx, cy, r], index) => (
                      <circle key={index} cx={cx} cy={cy} r={r} fill="var(--bp-pinky-mane)" />
                    ))}

                    <ellipse
                      cx="100"
                      cy="52"
                      rx="38"
                      ry="20"
                      fill="var(--bp-pinky-mane-hi)"
                      opacity="0.55"
                    />
                  </g>

                  <g className="bp-ln-ear-l">
                    <ellipse
                      cx="66"
                      cy="35"
                      rx="9.5"
                      ry="12.5"
                      transform="rotate(-26 66 35)"
                      fill="var(--bp-pinky-fur)"
                      {...RIM}
                    />
                    <ellipse
                      cx="67"
                      cy="37"
                      rx="4.8"
                      ry="6.6"
                      transform="rotate(-26 67 37)"
                      fill="var(--bp-pinky-ear)"
                    />
                  </g>
                  <g className="bp-ln-ear-r">
                    <ellipse
                      cx="134"
                      cy="35"
                      rx="9.5"
                      ry="12.5"
                      transform="rotate(26 134 35)"
                      fill="var(--bp-pinky-fur)"
                      {...RIM}
                    />
                    <ellipse
                      cx="133"
                      cy="37"
                      rx="4.8"
                      ry="6.6"
                      transform="rotate(26 133 37)"
                      fill="var(--bp-pinky-ear)"
                    />
                  </g>

                  <circle cx="100" cy="80" r="33" fill="var(--bp-pinky-fur)" {...RIM} />
                  <ellipse
                    cx="100"
                    cy="66"
                    rx="28"
                    ry="17"
                    fill="var(--bp-pinky-fur-hi)"
                    opacity="0.5"
                  />
                  <ellipse
                    cx="100"
                    cy="104"
                    rx="26"
                    ry="12"
                    fill="var(--bp-pinky-fur-sh)"
                    opacity="0.45"
                  />

                  <ellipse
                    cx="72"
                    cy="90"
                    rx="8"
                    ry="5.5"
                    fill="var(--bp-pinky-blush)"
                    opacity="0.65"
                  />
                  <ellipse
                    cx="128"
                    cy="90"
                    rx="8"
                    ry="5.5"
                    fill="var(--bp-pinky-blush)"
                    opacity="0.65"
                  />

                  <g className="bp-ln-muzzle">
                    <ellipse cx="90" cy="97" rx="15" ry="12" fill="var(--bp-pinky-cream)" />
                    <ellipse cx="110" cy="97" rx="15" ry="12" fill="var(--bp-pinky-cream)" />

                    <path
                      d="M100 84.5C106.5 84.5 109.5 87 108.5 89.5C107.5 92 103 94.5 100 94.5C97 94.5 92.5 92 91.5 89.5C90.5 87 93.5 84.5 100 84.5Z"
                      fill="var(--bp-accent)"
                    />
                    <ellipse
                      cx="97"
                      cy="87.5"
                      rx="2.4"
                      ry="1.6"
                      fill="var(--bp-pinky-cream)"
                      opacity="0.5"
                    />

                    <path
                      d="M100 94.5V99M100 99C96.5 103.5 91.5 103 89.5 100.5M100 99C103.5 103.5 108.5 103 110.5 100.5"
                      fill="none"
                      stroke="var(--bp-pinky-fur-sh)"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>

                  <g className="bp-ln-eyes">
                    <g className="bp-ln-eye-l">
                      <ellipse cx="85" cy="74" rx="11" ry="12.5" fill="var(--bp-pinky-cream)" />
                      <circle
                        className="bp-ln-iris"
                        cx="85"
                        cy="75"
                        r="7"
                        fill="var(--bp-pinky-eye)"
                      />
                      <circle cx="82" cy="71" r="3.2" fill="var(--bp-pinky-cream)" />
                      <circle
                        cx="88"
                        cy="78.5"
                        r="1.6"
                        fill="var(--bp-pinky-cream)"
                        opacity="0.6"
                      />
                      {/* El recorte del párpado va en el grupo padre: en el mismo grupo se movería con él. */}
                      <g clipPath={`url(#${eyeClip}-l)`}>
                        <g className="bp-ln-lid-l">
                          <ellipse cx="85" cy="46" rx="15" ry="15" fill="var(--bp-pinky-fur)" />
                        </g>
                      </g>
                    </g>

                    <g className="bp-ln-eye-r">
                      <ellipse cx="115" cy="74" rx="11" ry="12.5" fill="var(--bp-pinky-cream)" />
                      <circle
                        className="bp-ln-iris"
                        cx="115"
                        cy="75"
                        r="7"
                        fill="var(--bp-pinky-eye)"
                      />
                      <circle cx="112" cy="71" r="3.2" fill="var(--bp-pinky-cream)" />
                      <circle
                        cx="118"
                        cy="78.5"
                        r="1.6"
                        fill="var(--bp-pinky-cream)"
                        opacity="0.6"
                      />
                      <g clipPath={`url(#${eyeClip}-r)`}>
                        <g className="bp-ln-lid-r">
                          <ellipse cx="115" cy="46" rx="15" ry="15" fill="var(--bp-pinky-fur)" />
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              </g>

              <g className="bp-ln-arm-l-pose">
                <g className="bp-ln-arm-l-loop">
                  <path
                    d="M74 140C62 148 56 160 58 172"
                    fill="none"
                    stroke="var(--bp-pinky-line)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path
                    d="M74 140C62 148 56 160 58 172"
                    fill="none"
                    stroke="var(--bp-pinky-fur)"
                    strokeWidth="13"
                    strokeLinecap="round"
                  />
                  <circle cx="58" cy="172" r="9.5" fill="var(--bp-pinky-fur)" {...RIM} />
                  <circle cx="58" cy="173" r="5.5" fill="var(--bp-pinky-cream)" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
