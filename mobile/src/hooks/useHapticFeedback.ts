import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Hook for triggering haptic feedback on iOS devices
 * Uses Capacitor Haptics plugin
 */
export const useHapticFeedback = () => {
  const triggerHaptic = useCallback(async (type: HapticFeedbackType = 'light') => {
    try {
      switch (type) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
    } catch (error) {
      // Haptics not available (e.g., in browser or unsupported device)
      console.debug('Haptic feedback not available:', error);
    }
  }, []);

  const vibrateSelection = useCallback(async () => {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (error) {
      console.debug('Selection haptic not available:', error);
    }
  }, []);

  return {
    triggerHaptic,
    vibrateSelection,
  };
};
