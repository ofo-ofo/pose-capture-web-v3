/**
 * Tracks the stability of consecutive green frames to determine when an auto-capture should occur.
 * A simple counter is incremented for each green frame, decremented for amber and reset on red.
 */
let greenCount = 0;

export function updateStability(
  level: 'green' | 'amber' | 'red',
  stabilityFrames: number
): { greenCount: number; shouldCapture: boolean } {
  if (level === 'green') {
    greenCount++;
  } else if (level === 'amber') {
    // Minor degradation: allow up to a couple of amber frames without resetting
    if (greenCount > 0) greenCount = Math.max(0, greenCount - 1);
  } else {
    greenCount = 0;
  }
  const shouldCapture = greenCount >= stabilityFrames;
  return { greenCount, shouldCapture };
}

/**
 * Capture the current video frame as a JPEG blob.
 * Quality is fixed at 0.92 to balance size and fidelity.
 */
export async function captureFrame(videoEl: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(videoEl, 0, 0);
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode frame'));
      },
      'image/jpeg',
      0.92
    );
  });
}