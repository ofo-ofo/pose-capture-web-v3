/**
 * Exposes the application version at runtime. The value is injected at build time
 * via define in vite.config.ts. If unspecified, falls back to '0.0.0'.
 */
export const APP_VERSION: string = (import.meta as any).env.VITE_APP_VERSION || (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0');