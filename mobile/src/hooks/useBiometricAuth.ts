import { useState, useCallback } from 'react';
import { BiometricAuth, CheckBiometryResult } from '@aparajita/capacitor-biometric-auth';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for biometric authentication (Face ID / Touch ID) on iOS
 * Uses @aparajita/capacitor-biometric-auth plugin
 */
export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [biometryType, setBiometryType] = useState<string>('');

  const checkAvailability = useCallback(async () => {
    try {
      const result: CheckBiometryResult = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable);
      setBiometryType(result.biometryType?.toString() || '');
      return result.isAvailable;
    } catch (error) {
      console.debug('Biometric auth not available:', error);
      setIsAvailable(false);
      return false;
    }
  }, []);

  const authenticate = useCallback(
    async (reason: string = 'Authenticate to access the app'): Promise<BiometricAuthResult> => {
      try {
        const available = await checkAvailability();
        
        if (!available) {
          return {
            success: false,
            error: 'Biometric authentication is not available on this device',
          };
        }

        await BiometricAuth.authenticate({
          reason,
          cancelTitle: 'Cancel',
          allowDeviceCredential: true,
          iosFallbackTitle: 'Use Passcode',
          androidTitle: 'Biometric Authentication',
          androidSubtitle: 'Authenticate to continue',
          androidConfirmationRequired: false,
        });

        return { success: true };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Authentication failed',
        };
      }
    },
    [checkAvailability]
  );

  return {
    isAvailable,
    biometryType,
    checkAvailability,
    authenticate,
  };
};
