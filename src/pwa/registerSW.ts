// Optional: wrapper for service worker registration. Currently unused
// but kept for future extensibility.
// eslint-disable-next-line import/no-unresolved
import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  registerSW({ immediate: true });
}