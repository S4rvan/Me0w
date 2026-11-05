// Screen Wake Lock API helper to keep the screen active while watching lyrics

let wakeLockSentinel: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      return false;
    }
  }
  return false;
}

export async function releaseWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    } catch (err) {
      console.warn('Wake Lock release failed:', err);
    }
  }
}
