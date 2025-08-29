/**
 * Detects if the current device is running iOS. Useful for applying workarounds
 * for Safari PWA and viewport bugs.
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Updates the --vh CSS variable to reflect the actual viewport height. This is
 * necessary on iOS where 100vh includes the browser chrome by default. Call this
 * on load and on resize events.
 */
export function fix100vh(): void {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}