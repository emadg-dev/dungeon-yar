/**
 * Haptic feedback utility using navigator.vibrate
 * Feature-detected and safe across all browsers.
 */

const HAPTICS_KEY = 'zorvania_haptics_enabled';

export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const val = localStorage.getItem(HAPTICS_KEY);
  return val === null ? true : val === 'true';
}

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HAPTICS_KEY, String(enabled));
}

export function triggerHaptic(type: 'tap' | 'roll' | 'crit' | 'fumble' | 'rest' | 'success' | 'destructive'): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  if (!isHapticsEnabled()) return;

  try {
    switch (type) {
      case 'crit':
        // Double punch celebration for Nat 20
        navigator.vibrate([50, 60, 120]);
        break;
      case 'fumble':
        // Heavy warning buzz for Nat 1
        navigator.vibrate([100, 50, 100]);
        break;
      case 'rest':
        // Gentle triple pulse
        navigator.vibrate([30, 40, 30, 40, 30]);
        break;
      case 'destructive':
        navigator.vibrate([70, 40, 70]);
        break;
      case 'success':
        navigator.vibrate([40, 50]);
        break;
      case 'roll':
        navigator.vibrate(30);
        break;
      case 'tap':
      default:
        navigator.vibrate(15);
        break;
    }
  } catch {
    // ignore if blocked by device
  }
}
