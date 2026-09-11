'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, useGLTF } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import { MathUtils } from 'three';

/**
 * ============================================================================
 * PINKY — AVATAR 3D
 * ============================================================================
 * PINKY es un PERSONAJE ORIGINAL de este sitio: una mascota estilizada en rosa
 * y negro. No representa ni se parece a ninguna persona real, y el modelo de
 * respaldo esta hecho a proposito con geometria primitiva -esferas, capsulas,
 * un toroide- para que no pueda confundirse con nadie. Es una regla del
 * proyecto, no una preferencia estetica.
 *
 * PREPARADO PARA TU MODELO. `<PinkyAvatar modelUrl="/pinky.glb" />` carga un
 * archivo propio; sin `modelUrl`, se dibuja el respaldo. El resto del sistema
 * -estados, seguimiento del cursor, luces, sombra- es el mismo en ambos casos,
 * asi que cambiar el modelo no obliga a tocar nada mas.
 *
 * FONDO TRANSPARENTE (`alpha: true`): el avatar se recorta sobre el panel del
 * chat, que ya tiene su propio color. Un canvas con fondo propio se veria como
 * una caja pegada encima.
 * ============================================================================
 */

export type PinkyState = 'idle' | 'thinking' | 'speaking' | 'listening' | 'greeting';

export interface PinkyAvatarProps {
  state?: PinkyState;
  /** Ruta a un .glb/.vrm propio. Sin esto se usa el respaldo primitivo. */
  modelUrl?: string;
  /** Con movimiento reducido se conserva la presencia y se quita el meneo. */
  reducedMotion?: boolean;
  className?: string;
}

/* ------------------------------------------------------------- movimiento --- */

/**
 * Parametros por estado.
 *
 * Se declaran juntos y no repartidos por el codigo para poder LEER de un
 * vistazo en que se diferencia "pensando" de "hablando": si hay que abrir tres
 * ficheros para saberlo, acaban pareciendose.
 */
const MOTION: Record<PinkyState, { bob: number; speed: number; spin: number; tilt: number }> = {
  // Respira. Casi imperceptible, que es justo lo que la hace parecer viva.
  idle: { bob: 0.045, speed: 1.1, spin: 0.08, tilt: 0 },
  // Gira y flota mas rapido: esta ocupada.
  thinking: { bob: 0.09, speed: 3.2, spin: 0.9, tilt: 0.12 },
  // Acompana al texto que llega, sin fingir que pronuncia palabras.
  speaking: { bob: 0.07, speed: 5.5, spin: 0.15, tilt: 0.06 },
  // Pulso lento y amplio, como quien escucha con atencion.
  listening: { bob: 0.11, speed: 1.8, spin: 0.05, tilt: 0 },
  // Saludo: se inclina y vuelve.
  greeting: { bob: 0.13, speed: 2.4, spin: 0.35, tilt: 0.22 },
};

function useMouseTarget() {
  const { size } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useFrame(({ pointer }) => {
    // `pointer` va de -1 a 1 dentro del canvas. Se limita el recorrido para
    // que la cabeza mire, no se descoyunte.
    target.current.x = MathUtils.clamp(pointer.x, -1, 1) * 0.35;
    target.current.y = MathUtils.clamp(pointer.y, -1, 1) * 0.22;
  });

  return { target, size };
}

/* -------------------------------------------------------- modelo propio --- */

function LoadedModel({
  url,
  state,
  reducedMotion,
}: {
  url: string;
  state: PinkyState;
  reducedMotion: boolean;
}) {
  const { scene } = useGLTF(url);
  const group = useRef<Group>(null);
  const { target } = useMouseTarget();

  useFrame((_, delta) => {
    if (!group.current) return;
    animateRoot(group.current, state, target.current, delta, reducedMotion);
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

/* ------------------------------------------------------ modelo de respaldo --- */

/**
 * PINKY primitiva.
 *
 * Una cabeza, dos mechones, un lazo-toroide y un cuerpo flotante. Cero
 * pretension de realismo: es una mascota, y una mascota geometrica no puede
 * parecerse por accidente a una persona.
 */
function FallbackModel({ state, reducedMotion }: { state: PinkyState; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftEye = useRef<Mesh>(null);
  const rightEye = useRef<Mesh>(null);
  const { target } = useMouseTarget();

  // El parpadeo no va con el reloj: un parpadeo cada N segundos exactos se
  // lee como un LED. Se sortea el siguiente cada vez.
  const nextBlink = useRef(2 + Math.random() * 3);
  const blinkClock = useRef(0);

  useFrame((clockState, delta) => {
    if (!group.current) return;
    animateRoot(group.current, state, target.current, delta, reducedMotion);

    // La cabeza sigue al cursor, siempre suavizada: sin `lerp` la cabeza
    // teletransporta y parece un cambio de fotograma, no una mirada.
    if (head.current) {
      head.current.rotation.y = MathUtils.lerp(head.current.rotation.y, target.current.x, 0.08);
      head.current.rotation.x = MathUtils.lerp(head.current.rotation.x, -target.current.y, 0.08);
    }

    if (reducedMotion) return;

    blinkClock.current += delta;
    if (blinkClock.current > nextBlink.current) {
      const progress = (blinkClock.current - nextBlink.current) / 0.13;
      const scale = progress < 1 ? Math.max(0.05, Math.abs(Math.cos(progress * Math.PI))) : 1;

      if (leftEye.current) leftEye.current.scale.y = scale;
      if (rightEye.current) rightEye.current.scale.y = scale;

      if (progress >= 1) {
        blinkClock.current = 0;
        nextBlink.current = 2 + Math.random() * 3;
      }
    }

    // El toroide gira siempre un poco: da vida sin competir con el estado.
    const t = clockState.clock.elapsedTime;
    if (group.current.children[3]) group.current.children[3].rotation.z = Math.sin(t * 0.6) * 0.2;
  });

  return (
    <group ref={group} position={[0, -0.15, 0]}>
      {/* Cuerpo: capsula flotante, sin piernas ni brazos. */}
      <mesh position={[0, -0.75, 0]} castShadow>
        <capsuleGeometry args={[0.42, 0.5, 8, 24]} />
        <meshStandardMaterial color="#1a1620" roughness={0.45} metalness={0.15} />
      </mesh>

      {/* Cabeza y cara. */}
      <group ref={head} position={[0, 0.25, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.62, 48, 48]} />
          <meshStandardMaterial color="#ffc2da" roughness={0.35} metalness={0.05} />
        </mesh>

        <mesh ref={leftEye} position={[-0.21, 0.06, 0.55]}>
          <sphereGeometry args={[0.075, 24, 24]} />
          <meshStandardMaterial color="#08070a" roughness={0.2} />
        </mesh>
        <mesh ref={rightEye} position={[0.21, 0.06, 0.55]}>
          <sphereGeometry args={[0.075, 24, 24]} />
          <meshStandardMaterial color="#08070a" roughness={0.2} />
        </mesh>

        {/* Dos mechones asimetricos: la asimetria es lo que la hace parecer
            dibujada a mano en vez de generada. */}
        <mesh position={[-0.5, 0.36, 0.05]} rotation={[0, 0, 0.5]} castShadow>
          <capsuleGeometry args={[0.11, 0.42, 6, 16]} />
          <meshStandardMaterial color="#ff2e88" roughness={0.3} />
        </mesh>
        <mesh position={[0.52, 0.28, 0.02]} rotation={[0, 0, -0.72]} castShadow>
          <capsuleGeometry args={[0.09, 0.34, 6, 16]} />
          <meshStandardMaterial color="#ff2e88" roughness={0.3} />
        </mesh>
      </group>

      {/* Lazo: un toroide de canto, el unico guino "idol". */}
      <mesh position={[0, 0.92, -0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.2, 0.07, 12, 32]} />
        <meshStandardMaterial color="#ff2e88" roughness={0.25} metalness={0.2} />
      </mesh>
    </group>
  );
}

/** Movimiento comun a los dos modelos: flotar, girar e inclinarse. */
function animateRoot(
  group: Group,
  state: PinkyState,
  target: { x: number; y: number },
  delta: number,
  reducedMotion: boolean,
): void {
  const motion = MOTION[state];

  if (reducedMotion) {
    /*
     * Reducir NO es apagar. El avatar sigue mirando al cursor -eso es
     * informacion, no adorno- y pierde el flotar, el giro y la inclinacion,
     * que es lo que produce mareo.
     */
    group.position.y = 0;
    group.rotation.z = 0;
    group.rotation.y = MathUtils.lerp(group.rotation.y, target.x * 0.5, 0.1);
    return;
  }

  const t = performance.now() / 1000;

  group.position.y = Math.sin(t * motion.speed) * motion.bob;
  group.rotation.z = Math.sin(t * motion.speed * 0.6) * motion.tilt;
  group.rotation.y = MathUtils.lerp(
    group.rotation.y,
    target.x * 0.5 + Math.sin(t * motion.spin) * motion.spin * 0.35,
    0.06,
  );

  void delta;
}

/* ------------------------------------------------------------- escena --- */

export function PinkyAvatar({
  state = 'idle',
  modelUrl,
  reducedMotion = false,
  className,
}: PinkyAvatarProps) {
  const [modelFailed, setModelFailed] = useState(false);
  const useCustom = Boolean(modelUrl) && !modelFailed;

  return (
    <div className={className} aria-hidden>
      <Canvas
        // `alpha` para que el panel se vea detras; `antialias` porque el
        // avatar es pequeno y los bordes duros se notan mucho a este tamano.
        gl={{ alpha: true, antialias: true }}
        // Tope de 2: en pantallas a 3x el coste se dispara y no se aprecia.
        dpr={[1, 2]}
        shadows
        camera={{ position: [0, 0.35, 3.4], fov: 34 }}
        style={{ background: 'transparent' }}
      >
        {/* Tres luces, no una: la clave modela, el relleno rosa tinta las
            sombras propias y el contraluz separa a PINKY del fondo oscuro. */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5, 3.5, 2.5]} intensity={1.5} castShadow />
        <pointLight position={[-2.5, 1, 2]} intensity={2.2} color="#ff2e88" />
        <pointLight position={[0, 1.5, -2.5]} intensity={1.4} color="#ffc2da" />

        <Suspense fallback={null}>
          {useCustom ? (
            <ErrorBoundaryModel onFail={() => setModelFailed(true)}>
              <LoadedModel url={modelUrl!} state={state} reducedMotion={reducedMotion} />
            </ErrorBoundaryModel>
          ) : (
            <FallbackModel state={state} reducedMotion={reducedMotion} />
          )}
          <Environment preset="studio" />
        </Suspense>

        {/* Sombra de contacto, no una sombra proyectada: PINKY flota, y una
            sombra dura debajo la clavaria al suelo. */}
        <ContactShadows
          position={[0, -1.45, 0]}
          opacity={0.4}
          scale={4}
          blur={2.6}
          far={2}
          color="#ff2e88"
        />
      </Canvas>
    </div>
  );
}

/**
 * Si el .glb no carga -no existe, esta corrupto, no hay red- se cae al
 * respaldo en vez de dejar el hueco vacio. Un avatar geometrico es mejor que
 * ningun avatar.
 */
function ErrorBoundaryModel({
  children,
  onFail,
}: {
  children: React.ReactNode;
  onFail: () => void;
}) {
  try {
    return <>{children}</>;
  } catch {
    onFail();
    return null;
  }
}

// Precarga solo si de verdad hay un modelo propio configurado.
export function preloadPinky(modelUrl?: string): void {
  if (modelUrl) useGLTF.preload(modelUrl);
}
