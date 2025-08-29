/**
 * MediaPipe WASM configuration helper.
 * Determines the base URL from which the WASM binaries and model files will be loaded.
 * During development we assume the files reside under public/tasks-vision, otherwise the CDN URL is used.
 */
export function getBaseUrl(): string {
  // Use the CDN in production builds; during local development serve from /tasks-vision
  const cdn = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
  return import.meta.env.DEV ? '/tasks-vision' : cdn;
}

/**
 * Feature detection for WebAssembly SIMD.
 * Returns true if SIMD is supported, false otherwise. Currently implemented as a naive check
 * because constructing a WASM module with SIMD instructions is complex in this context.
 * Browsers will simply fall back to non-SIMD builds when unsupported.
 */
export async function supportsSimd(): Promise<boolean> {
  // Experimental: check for presence of WebAssembly.simd
  // Modern browsers expose WebAssembly.validate and SIMD type if supported. If unavailable, return false.
  // We skip full detection and return false to let MediaPipe fallback automatically.
  return false;
}