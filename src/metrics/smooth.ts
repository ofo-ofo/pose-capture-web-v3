/**
 * Exponential moving average helper.
 * Given a previous value and the next sample, compute the new EMA with the given alpha.
 * If prev is null, returns next.
 */
export function ema(prev: number | null, next: number, alpha: number): number {
  if (prev === null || prev === undefined) return next;
  return prev * (1 - alpha) + next * alpha;
}