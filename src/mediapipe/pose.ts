import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// Types describing the configuration and results of the pose landmarker
export type PoseInit = {
  baseUrl: string;
  model: 'lite' | 'full';
  simdPreferred?: boolean;
  selfieMode?: boolean;
};

export type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type PoseResult = {
  landmarks: Landmark[] | null;
  presence: number;
};

/**
 * Initialise a PoseLandmarker instance. The caller must pass a base URL for
 * the MediaPipe assets. See mediapipe/wasm-config.ts for helper functions.
 */
export async function initPoseLandmarker(
  cfg: PoseInit
): Promise<{ detect: (src: HTMLVideoElement | ImageBitmap) => Promise<PoseResult>; close: () => void }> {
  const { baseUrl, model, selfieMode = true } = cfg;
  // Resolve the appropriate model type; tasks-vision exposes constants for the different models
  const fileset = await FilesetResolver.forVisionTasks(baseUrl);
  const landmarker = await PoseLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        model === 'lite'
          ? 'pose_landmarker_lite.task'
          : 'pose_landmarker_full.task'
    },
    numPoses: 1,
    runningMode: 'VIDEO',
    selfieMode
  });
  return {
    async detect(src: HTMLVideoElement | ImageBitmap): Promise<PoseResult> {
      // For video mode, a timestamp must be provided in microseconds
      const now = performance.now();
      const result = await landmarker.detectForVideo(src as HTMLVideoElement, now);
      const presence = result.posePresence && result.posePresence.length > 0 ? result.posePresence[0] : 0;
      const landmarks = result.landmarks && result.landmarks.length > 0 ? (result.landmarks[0] as unknown as Landmark[]) : null;
      return { landmarks, presence };
    },
    close() {
      landmarker.close();
    }
  };
}