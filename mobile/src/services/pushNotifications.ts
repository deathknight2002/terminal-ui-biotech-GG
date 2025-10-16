import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export type NotificationType = 'fda_alert' | 'price_change' | 'catalyst' | 'news' | 'trial_update';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    symbol?: string;
    assetId?: string;
    catalystId?: string;
    url?: string;
    [key: string]: any;
  };
}

class PushNotificationService {
  private isInitialized = false;
  private registrationToken: string | null = null;
  private listeners: Map<NotificationType, Set<(payload: NotificationPayload) => void>> = new Map();

  /**
   * Initialize push notifications
   * Must be called after user grants permission
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Push] Already initialized');
      return;
    }

    // Check if running on native platform
    if (!Capacitor.isNativePlatform()) {
      console.warn('[Push] Not running on native platform, push notifications not available');
      return;
    }

    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Register with APNs
        await PushNotifications.register();
        console.log('[Push] Registration requested');
      } else {
        console.warn('[Push] Permission denied');
        throw new Error('Push notification permission denied');
      }

      // Setup listeners
      this.setupListeners();
      this.isInitialized = true;
      console.log('[Push] Initialized successfully');
    } catch (error) {
      console.error('[Push] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup push notification event listeners
   */
  private setupListeners(): void {
    // Handle registration success
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('[Push] Registration success, token:', token.value);
      this.registrationToken = token.value;
      
      // Send token to backend for storage
      this.sendTokenToBackend(token.value).catch((error) => {
        console.error('[Push] Failed to send token to backend:', error);
      });
    });

    // Handle registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('[Push] Registration error:', error);
    });

    // Handle notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('[Push] Notification received in foreground:', notification);
      this.handleNotification(notification);
    });

    // Handle notification tapped/opened
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('[Push] Notification action performed:', action);
      this.handleNotificationAction(action);
    });
  }

  /**
   * Send device token to backend for storage
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      const response = await fetch('http://localhost:3001/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform: 'ios',
          deviceId: await this.getDeviceId(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register token: ${response.statusText}`);
      }

      console.log('[Push] Token registered with backend');
    } catch (error) {
      console.error('[Push] Failed to register token with backend:', error);
      throw error;
    }
  }

  /**
   * Get device ID (uses Capacitor Device plugin if available)
   */
  private async getDeviceId(): Promise<string> {
    // In production, use @capacitor/device plugin
    // For now, generate a simple ID
    return `device-${Date.now()}`;
  }

  /**
   * Handle notification received
   */
  private handleNotification(notification: any): void {
    const payload: NotificationPayload = {
      type: notification.data?.type || 'news',
      title: notification.title || 'Notification',
      body: notification.body || '',
      data: notification.data,
    };

    // Emit to listeners
    const listeners = this.listeners.get(payload.type);
    if (listeners) {
      listeners.forEach((listener) => listener(payload));
    }

    // Emit to global listeners
    const globalListeners = this.listeners.get('news' as NotificationType);
    if (globalListeners && payload.type !== 'news') {
      globalListeners.forEach((listener) => listener(payload));
    }
  }

  /**
   * Handle notification action (user tapped notification)
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const notification = action.notification;
    const payload: NotificationPayload = {
      type: notification.data?.type || 'news',
      title: notification.title || 'Notification',
      body: notification.body || '',
      data: notification.data,
    };

    console.log('[Push] Notification tapped:', payload);

    // Handle navigation based on notification type
    if (payload.data?.url) {
      window.location.href = payload.data.url;
    }
  }

  /**
   * Subscribe to FDA alerts
   */
  async subscribeToFDAAlerts(symbols: string[]): Promise<void> {
    if (!this.registrationToken) {
      console.warn('[Push] No registration token available');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/notifications/subscribe/fda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.registrationToken,
          symbols,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to subscribe to FDA alerts: ${response.statusText}`);
      }

      console.log('[Push] Subscribed to FDA alerts for:', symbols);
    } catch (error) {
      console.error('[Push] Failed to subscribe to FDA alerts:', error);
      throw error;
    }
  }

  /**
   * Subscribe to price change alerts
   */
  async subscribeToPriceAlerts(symbols: string[], threshold: number = 5): Promise<void> {
    if (!this.registrationToken) {
      console.warn('[Push] No registration token available');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/notifications/subscribe/price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.registrationToken,
          symbols,
          threshold,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to subscribe to price alerts: ${response.statusText}`);
      }

      console.log('[Push] Subscribed to price alerts for:', symbols, `threshold: ${threshold}%`);
    } catch (error) {
      console.error('[Push] Failed to subscribe to price alerts:', error);
      throw error;
    }
  }

  /**
   * Add notification listener
   */
  addListener(type: NotificationType, callback: (payload: NotificationPayload) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  /**
   * Remove notification listener
   */
  removeListener(type: NotificationType, callback: (payload: NotificationPayload) => void): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Get registration token
   */
  getToken(): string | null {
    return this.registrationToken;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
