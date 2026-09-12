// Corta las llamadas a un servicio que falla repetidamente.

import { Logger } from '@nestjs/common';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  openMs: number;
  successThreshold: number;
}

export const DEFAULT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  openMs: 15_000,
  successThreshold: 2,
};

export class CircuitOpenError extends Error {
  constructor(readonly target: string) {
    super(`El circuito hacia "${target}" esta abierto.`);
    this.name = 'CircuitOpenError';
  }
}

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
    if (this.state === 'open' && Date.now() - this.openedAt >= this.options.openMs) {
      this.state = 'half-open';
      this.successes = 0;
      this.logger.log(`Circuito hacia "${this.target}" en prueba (half-open).`);
    }
    return this.state;
  }

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

  snapshot(): { state: CircuitState; failures: number } {
    return { state: this.currentState, failures: this.failures };
  }
}
