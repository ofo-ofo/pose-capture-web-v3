export type Thresholds = {
  rollMaxDeg: number;
  centerOffsetMax: number;
  heightRatioMin: number;
  topMarginMin: number;
  bottomMarginMin: number;
  lumaMin: number;
  stabilityFrames: number;
  presenceMin: number;
};

/**
 * Evaluate the set of smoothed metrics against the provided thresholds.
 * Returns pass/fail, a list of failed criteria and an overall level:
 * - green: all conditions satisfied
 * - amber: minor issues (e.g. luma below threshold or centre offset)
 * - red: critical failures (roll, height, margins, presence)
 */
export function evaluate(
  metrics: {
    rollDeg: number;
    center: number;
    height: number;
    top: number;
    bottom: number;
    luma: number;
    presence: number;
  },
  t: Thresholds
): { passAll: boolean; reasons: string[]; level: 'green' | 'amber' | 'red' } {
  const reasons: string[] = [];
  let level: 'green' | 'amber' | 'red' = 'green';
  if (metrics.presence < t.presenceMin) {
    reasons.push('presence');
    level = 'red';
  }
  if (metrics.rollDeg > t.rollMaxDeg) {
    reasons.push('roll');
    level = 'red';
  }
  if (metrics.height < t.heightRatioMin) {
    reasons.push('height');
    level = 'red';
  }
  if (metrics.top < t.topMarginMin) {
    reasons.push('top');
    level = 'red';
  }
  if (metrics.bottom < t.bottomMarginMin) {
    reasons.push('bottom');
    level = 'red';
  }
  if (metrics.luma < t.lumaMin) {
    reasons.push('luma');
    if (level === 'green') level = 'amber';
  }
  if (metrics.center > t.centerOffsetMax) {
    reasons.push('center');
    if (level === 'green') level = 'amber';
  }
  return { passAll: level === 'green', reasons, level };
}