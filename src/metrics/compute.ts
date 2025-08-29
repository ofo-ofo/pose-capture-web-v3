import type { Landmark } from '../mediapipe/pose';

/**
 * Compute the roll angle (tilt) of the shoulders in degrees.
 * We take the vector between the left and right shoulder landmarks (indices 11 and 12) and compute the
 * absolute value of its angle relative to the horizontal axis.
 */
export function computeRollDeg(lms: Landmark[]): number {
  const leftShoulder = lms[11];
  const rightShoulder = lms[12];
  if (!leftShoulder || !rightShoulder) return 0;
  const dy = rightShoulder.y - leftShoulder.y;
  const dx = rightShoulder.x - leftShoulder.x;
  const rad = Math.atan2(dy, dx);
  return Math.abs((rad * 180) / Math.PI);
}

/**
 * Compute the horizontal offset of the torso centre from the video centre.
 * We average the x coordinates of the shoulders and hips (indices 11, 12, 23, 24) then compute
 * the absolute difference from 0.5 (centre of the normalised coordinate system).
 */
export function computeCenterOffset(lms: Landmark[], videoW: number): number {
  const ls = lms[11];
  const rs = lms[12];
  const lh = lms[23];
  const rh = lms[24];
  if (!ls || !rs || !lh || !rh) return 0;
  const cx = (ls.x + rs.x + lh.x + rh.x) / 4;
  return Math.abs(cx - 0.5);
}

/**
 * Compute the ratio between the vertical distance from head to feet and the height of the frame.
 * We estimate the head position with landmark 0 (nose) and the feet by taking the maximum y of landmarks 31 and 32 (toes).
 */
export function computeHeightRatio(lms: Landmark[], videoH: number): number {
  const headY = lms[0]?.y ?? 0;
  const footY = Math.max(lms[31]?.y ?? 1, lms[32]?.y ?? 1);
  return footY - headY;
}

/**
 * Compute the top and bottom margins. Top margin is the distance from the head to the top of the frame;
 * bottom margin is the distance from the feet to the bottom of the frame. Both values are normalised [0..1].
 */
export function computeMargins(lms: Landmark[], videoH: number): { top: number; bottom: number } {
  const headY = lms[0]?.y ?? 0;
  const footY = Math.max(lms[31]?.y ?? 1, lms[32]?.y ?? 1);
  const top = headY;
  const bottom = 1 - footY;
  return { top, bottom };
}

/**
 * Estimate the average luminance (brightness) of the current video frame.
 * Downscales the frame to 64×64 and computes the mean luma using the Rec. 601 coefficients.
 */
export async function estimateLuma(videoEl: HTMLVideoElement): Promise<number> {
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  ctx.drawImage(videoEl, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Rec.601 luma calculation
    sum += 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return sum / (data.length / 4);
}