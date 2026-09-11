/**
 * ============================================================================
 * CUÁNTO LLEVA EL GRUPO
 * ============================================================================
 * Aritmética de calendario para el contador de `/grupo`. Vive aparte porque
 * la usan las dos mitades: el servidor, para pintar la cifra de verdad en el
 * HTML, y el cliente, para corregirla y para volver a calcularla al cambiar
 * el día.
 *
 * TODO EN UTC, igual que `format.ts`. No es una manía: son días de
 * calendario, no instantes, y si cada mitad usara su propio huso el HTML del
 * servidor no coincidiría con el del navegador. Se paga un desfase de horas
 * para quien esté muy al este o muy al oeste, y a cambio la cifra es la misma
 * para todo el mundo, que es lo que se espera de un dato publicado.
 *
 * `now` ENTRA COMO ARGUMENTO en vez de leerse dentro. Así las dos funciones
 * son puras, el servidor puede pasar su instante y el cliente el suyo, y no
 * hace falta un reloj falso para probarlas.
 * ============================================================================
 */

/** Medianoche UTC de una fecha `YYYY-MM-DD`. */
function utcMidnight(isoDate: string): number {
  return Date.parse(`${isoDate}T00:00:00.000Z`);
}

const DAY_MS = 86_400_000;

/**
 * Días COMPLETOS transcurridos desde la fecha, en UTC.
 *
 * El día del propio debut cuenta como 0: ese día el grupo llevaba cero días
 * publicando, no uno.
 */
export function daysSince(isoDate: string, now: number): number {
  const start = utcMidnight(isoDate);
  if (Number.isNaN(start)) return 0;

  // Se compara medianoche contra medianoche: contar desde la hora actual
  // haría que la cifra cambiara a media tarde según el huso de cada visitante.
  const today = Math.floor(now / DAY_MS) * DAY_MS;
  return Math.max(0, Math.round((today - start) / DAY_MS));
}

/**
 * Años COMPLETOS transcurridos, en UTC.
 *
 * No se divide por 365,25: eso adelantaría el aniversario unas horas cada
 * cuatro años. Se compara mes y día, que es como lo cuenta una persona.
 */
export function yearsSince(isoDate: string, now: number): number {
  const start = new Date(utcMidnight(isoDate));
  if (Number.isNaN(start.getTime())) return 0;

  const today = new Date(now);

  let years = today.getUTCFullYear() - start.getUTCFullYear();

  const beforeAnniversary =
    today.getUTCMonth() < start.getUTCMonth() ||
    (today.getUTCMonth() === start.getUTCMonth() && today.getUTCDate() < start.getUTCDate());

  if (beforeAnniversary) years -= 1;

  return Math.max(0, years);
}

/**
 * Milisegundos que faltan para la próxima medianoche UTC.
 *
 * Es lo que hace que el contador esté «en vivo» sin mentir: no hace falta un
 * intervalo de un segundo para una cifra que cambia una vez al día, y un
 * intervalo así solo serviría para repintar lo mismo 86.400 veces.
 */
export function msUntilNextUtcMidnight(now: number): number {
  return DAY_MS - (now % DAY_MS);
}
