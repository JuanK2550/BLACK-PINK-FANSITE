import { Logger } from '@nestjs/common';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Fallos consecutivos antes de abrir el circuito. */
  failureThreshold: number;
  /** Tiempo que el circuito permanece abierto antes de dejar pasar una prueba. */
  openMs: number;
  /** Exitos seguidos en half-open que hacen falta para volver a cerrar. */
  successThreshold: number;
}

export const DEFAULT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  openMs: 15_000,
  successThreshold: 2,
};

/** El circuito esta abierto: la llamada ni siquiera se intenta. */
export class CircuitOpenError extends Error {
  constructor(readonly target: string) {
    super(`El circuito hacia "${target}" esta abierto.`);
    this.name = 'CircuitOpenError';
  }
}

/**
 * ============================================================================
 * CIRCUIT BREAKER
 * ============================================================================
 * Cuando un servicio esta caido, seguir llamandolo es peor que no llamarlo:
 *
 *  - cada peticion espera el tiempo limite completo antes de fallar, asi que
 *    una dependencia caida convierte respuestas de 20 ms en respuestas de 4 s;
 *  - esas esperas se acumulan y acaban agotando el gateway, que es lo que
 *    convierte la caida de UN servicio en la caida de TODO;
 *  - y el servicio que intenta levantarse recibe toda la carga de golpe.
 *
 * El interruptor corta ese ciclo. Tres estados:
 *
 *   closed    -> todo pasa. Se cuentan los fallos consecutivos.
 *   open      -> nada pasa; se falla al instante. Tras `openMs`, pasa a probar.
 *   half-open -> deja pasar peticiones de prueba. Si van bien, cierra; si una
 *                falla, vuelve a abrir sin agotar el resto de intentos.
 *
 * Hay UNO por servicio aguas arriba, no uno global: que content-service se
 * caiga no debe cortar las llamadas a media-service.
 * ============================================================================
 */
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);

  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private openedAt = 0;

  constructor(
    private readonly target: string,
    private readonly options: CircuitBreakerOptions = DEFAULT_BREAKER_OPTIONS,
  ) {}

  get currentState(): CircuitState {
    // El paso de open a half-open es perezoso: no hace falta un temporizador
    // corriendo cuando basta con mirar el reloj en la siguiente peticion.
    if (this.state === 'open' && Date.now() - this.openedAt >= this.options.openMs) {
      this.state = 'half-open';
      this.successes = 0;
      this.logger.log(`Circuito hacia "${this.target}" en prueba (half-open).`);
    }
    return this.state;
  }

  /** Ejecuta la operacion si el circuito lo permite. */
  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.currentState === 'open') {
      throw new CircuitOpenError(this.target);
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordSuccess(): void {
    if (this.state === 'half-open') {
      this.successes += 1;
      if (this.successes >= this.options.successThreshold) {
        this.close();
      }
      return;
    }
    this.failures = 0;
  }

  private recordFailure(): void {
    if (this.state === 'half-open') {
      // Un solo fallo en prueba vuelve a abrir: el servicio sigue mal y no
      // tiene sentido gastar el resto de intentos para comprobarlo.
      this.open();
      return;
    }

    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) {
      this.open();
    }
  }

  private open(): void {
    this.state = 'open';
    this.openedAt = Date.now();
    this.successes = 0;
    this.logger.warn(
      `Circuito hacia "${this.target}" ABIERTO tras ${this.failures} fallos. ` +
        `Se reintentara en ${this.options.openMs} ms.`,
    );
  }

  private close(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.logger.log(`Circuito hacia "${this.target}" cerrado: el servicio responde.`);
  }

  /** Estado legible para la comprobacion de salud. */
  snapshot(): { state: CircuitState; failures: number } {
    return { state: this.currentState, failures: this.failures };
  }
}
