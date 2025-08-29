// src/mediapipe/wasm-config.ts
/**
 * tasks-vision WASM & asset'larını CDN'den yüklemek için baseUrl sağlar.
 * Public/tasks-vision klasörü boşsa da çalışır.
 *
 * Not: Sabit bir sürüme sabitliyoruz; istersen "latest" yerine bu sürümü güncelleyebilirsin.
 */
const CDN_VERSION = "0.10.14"; // uygun, stabil bir sürüm

export function getBaseUrl() {
  // CDN: .../@mediapipe/tasks-vision@<ver>/wasm
  return `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${CDN_VERSION}/wasm`;
}
