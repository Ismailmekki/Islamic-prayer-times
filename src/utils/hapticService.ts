/**
 * Haptic Feedback Service for Electronic Tasbih
 * Handles native Vibration API (navigator.vibrate) and iOS / unsupported audio-tactile fallback
 */

export type HapticIntensity = 'light' | 'medium' | 'strong';

class HapticService {
  /**
   * Checks if native vibration is supported by the user agent
   */
  public get isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function'
    );
  }

  /**
   * Duration in ms for standard tasbih bead click
   */
  private getDuration(intensity: HapticIntensity): number {
    switch (intensity) {
      case 'light':
        return 16;
      case 'strong':
        return 50;
      case 'medium':
      default:
        return 28;
    }
  }

  /**
   * Triggers a single bead click vibration
   */
  public triggerClick(intensity: HapticIntensity = 'medium'): boolean {
    if (this.isSupported) {
      try {
        const ms = this.getDuration(intensity);
        return navigator.vibrate(ms);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Triggers vibration when reaching a milestone (e.g. 10, 20 beads)
   */
  public triggerMilestone(): boolean {
    if (this.isSupported) {
      try {
        return navigator.vibrate([30, 40, 30]);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Triggers a joyful celebratory vibration pattern when completing a full cycle/goal (e.g. 33, 99, 100)
   */
  public triggerCelebration(): boolean {
    if (this.isSupported) {
      try {
        // Pattern: vibrate, pause, vibrate, pause, longer vibrate
        return navigator.vibrate([45, 55, 45, 55, 90]);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Triggers vibration on counter reset
   */
  public triggerReset(): boolean {
    if (this.isSupported) {
      try {
        return navigator.vibrate([25, 40, 25]);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Test button vibration to demonstrate current intensity to the user
   */
  public testPattern(intensity: HapticIntensity = 'medium'): boolean {
    return this.triggerClick(intensity);
  }
}

export const hapticService = new HapticService();
