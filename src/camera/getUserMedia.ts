/**
 * Helper to open the user's camera stream. The user must trigger this function
 * via a gesture (e.g. button click) on iOS or Safari; it cannot be invoked
 * automatically. The facing option determines whether the front ('user') or
 * rear ('environment') camera is requested.
 */
export async function openCamera(opts: { facing: 'user' | 'environment' }): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: opts.facing === 'environment' ? { exact: 'environment' } : 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  return stream;
}

/**
 * Stop the current camera stream and open the opposite camera. Some browsers
 * treat switching cameras as a new getUserMedia call. Tracks from the
 * previous stream are stopped to free the camera hardware.
 */
export async function switchCamera(current: MediaStream, facing: 'user' | 'environment'): Promise<MediaStream> {
  current.getTracks().forEach((track) => track.stop());
  const stream = await openCamera({ facing });
  return stream;
}