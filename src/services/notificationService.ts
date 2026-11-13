// Safely load Notifications without crashing if native module is absent in older APK binaries
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import logger from '../utils/logger';

const PUSH_TOKEN_STORAGE_KEY = '@campo_expo_push_token';
const LAST_VIEWED_NOTICES_KEY = '@campo_last_notices_viewed_at';
const LAST_ALERTED_ID_KEY = '@campo_last_alerted_id';
const SEEN_ALERT_IDS_KEY = '@campo_seen_alert_ids';
const ALERTS_BASELINE_INITIALIZED_KEY = '@campo_alerts_baseline_initialized';
const LAST_CHECKED_TIMESTAMP_KEY = '@campo_last_alert_checked_timestamp';
const PERMISSION_PROMPTED_KEY = '@campo_notification_prompted';
const EAS_PROJECT_ID = 'dfd664bd-0f17-41a3-a4d3-05e1ecb72fcb';

export interface InAppAlert {
  id: string | number;
  type: 'announcement' | 'event';
  category?: string;
  title: string;
  body?: string;
  url?: string;
}

// Configure default notification handler for foreground notifications if native module exists
try {
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  logger.warn('NOTIFICATIONS', 'Notification handler init skipped', e);
}

// Listeners for badge and in-app alert updates
type BadgeListener = (unreadCount: number) => void;
type AlertListener = (alert: InAppAlert) => void;

const badgeListeners = new Set<BadgeListener>();
const alertListeners = new Set<AlertListener>();

export const notificationService = {
  /**
   * Check if notification permission is currently granted
   */
  async checkHasPermission(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications?.getPermissionsAsync) return false;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Request notification permission with Settings fallback prompt
   */
  async requestPermissionWithPrompt(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications?.getPermissionsAsync) return false;

    try {
      const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') {
        await this.registerForPushNotifications();
        return true;
      }

      if (canAskAgain || existingStatus === 'undetermined') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await this.registerForPushNotifications();
          return true;
        }
      }

      // If user denied or can't ask again directly, guide them to device Settings
      Alert.alert(
        'Enable Notifications in Settings',
        'Notification permission is currently disabled. Open your device Settings to turn on alerts for campus circulars and events.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );

      return false;
    } catch (e: any) {
      logger.warn('NOTIFICATIONS', 'Failed to request permission', e?.message);
      return false;
    }
  },

  /**
   * Check if the user should be shown the permission setup modal on login
   */
  async shouldShowPermissionModal(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications?.getPermissionsAsync) return false;
    try {
      const hasPermission = await this.checkHasPermission();
      if (hasPermission) return false;

      const alreadyPrompted = await AsyncStorage.getItem(PERMISSION_PROMPTED_KEY);
      return !alreadyPrompted;
    } catch {
      return false;
    }
  },

  /**
   * Mark permission modal as dismissed
   */
  async markPermissionModalDismissed(): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSION_PROMPTED_KEY, 'true');
    } catch {}
  },

  /**
   * Register device for remote push notifications (Expo Push API)
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web' || !Notifications?.getExpoPushTokenAsync) return null;

    try {
      // 1. Android specific notification channel setup
      if (Platform.OS === 'android' && Notifications?.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Campo Campus Updates',
          description: 'Announcements, events, and important college notices',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E3A8A',
          sound: 'default',
        });
      }

      // 2. Check and request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.info('NOTIFICATIONS', 'Permission for push notifications was denied by user');
        return null;
      }

      // 3. Obtain Expo Push Token
      const tokenResult = await Notifications.getExpoPushTokenAsync({
        projectId: EAS_PROJECT_ID,
      });
      const pushToken = tokenResult.data;

      if (!pushToken) {
        logger.warn('NOTIFICATIONS', 'Failed to retrieve Expo push token');
        return null;
      }

      logger.info('NOTIFICATIONS', `Obtained push token: ${pushToken.substring(0, 30)}...`);

      // 4. Save locally and register with backend server for the authenticated user
      try {
        await api.post('/push/register-mobile', {
          token: pushToken,
          platform: Platform.OS,
        });
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);
        logger.info('NOTIFICATIONS', 'Push token registered with backend successfully');
      } catch (serverErr: any) {
        logger.warn('NOTIFICATIONS', 'Failed to register push token with backend', serverErr?.message);
      }

      return pushToken;
    } catch (err: any) {
      logger.warn('NOTIFICATIONS', 'Push notification setup error', err?.message);
      return null;
    }
  },

  /**
   * Check for newly published announcements and events to trigger live in-app banner & OS notifications.
   * Only triggers when a NEW announcement/event is actually published on the server.
   * Existing history is silently recorded as a baseline so old items never trigger popups.
   */
  async checkForNewAlerts(): Promise<void> {
    try {
      const isInitialized = await AsyncStorage.getItem(ALERTS_BASELINE_INITIALIZED_KEY);
      const lastCheckedStr = await AsyncStorage.getItem(LAST_CHECKED_TIMESTAMP_KEY);
      const lastCheckedTime = lastCheckedStr ? parseInt(lastCheckedStr, 10) : 0;

      const seenRaw = await AsyncStorage.getItem(SEEN_ALERT_IDS_KEY);
      let seenIds: string[] = [];
      try {
        seenIds = seenRaw ? JSON.parse(seenRaw) : [];
      } catch {
        seenIds = [];
      }

      // Fetch latest announcements and events
      const [annRes, eventRes] = await Promise.all([
        api.get('/announcements/student').catch(() => ({ data: [] })),
        api.get('/events/student').catch(() => ({ data: [] })),
      ]);

      const annList = annRes.data?.data || (Array.isArray(annRes.data) ? annRes.data : []);
      const eventList = eventRes.data?.data || (Array.isArray(eventRes.data) ? eventRes.data : []);

      // 1. BASELINE SETUP: On initial launch / fresh setup, mark all existing items as seen.
      // Do NOT trigger any popups for items that were already in the database!
      if (!isInitialized || lastCheckedTime === 0) {
        annList.forEach((item: any) => {
          const uniqueId = `ann_${item.id}`;
          if (!seenIds.includes(uniqueId)) seenIds.push(uniqueId);
        });
        eventList.forEach((item: any) => {
          const uniqueId = `event_${item.id}`;
          if (!seenIds.includes(uniqueId)) seenIds.push(uniqueId);
        });

        await AsyncStorage.multiSet([
          [SEEN_ALERT_IDS_KEY, JSON.stringify(seenIds.slice(-100))],
          [ALERTS_BASELINE_INITIALIZED_KEY, 'true'],
          [LAST_CHECKED_TIMESTAMP_KEY, Date.now().toString()],
        ]);
        logger.info('NOTIFICATIONS', 'Baseline initialized with existing history; no popups triggered.');
        await this.getUnreadCount();
        return;
      }

      // 2. SUBSEQUENT CHECKS: Only alert if an item is NEW (created after lastCheckedTime)
      const currentTime = Date.now();
      const twoHoursAgo = currentTime - 2 * 60 * 60 * 1000;
      const pendingAlerts: InAppAlert[] = [];

      // Check announcements
      annList.slice(0, 10).forEach((item: any) => {
        const uniqueId = `ann_${item.id}`;
        const itemTime = item.created_at ? new Date(item.created_at).getTime() : 0;

        if (!seenIds.includes(uniqueId)) {
          seenIds.push(uniqueId);

          // ONLY trigger a popup if the item was created AFTER our last check AND is recent (within 2h)
          const isNewlyPublished = itemTime > (lastCheckedTime - 30000) && itemTime >= twoHoursAgo;

          if (isNewlyPublished) {
            const titleLower = String(item.title || '').toLowerCase();
            let category = 'Circular';
            if (titleLower.includes('exam') || titleLower.includes('hall ticket') || titleLower.includes('timetable') || titleLower.includes('result')) {
              category = 'Exam / Academic';
            } else if (titleLower.includes('urgent') || titleLower.includes('important') || titleLower.includes('alert')) {
              category = 'Urgent Notice';
            } else if (titleLower.includes('holiday') || titleLower.includes('vacation')) {
              category = 'Holiday';
            } else if (item.category) {
              category = item.category;
            }

            pendingAlerts.push({
              id: item.id,
              type: 'announcement',
              category,
              title: item.title || 'Campus Circular',
              body: item.content || item.description || 'New campus circular available',
              url: '/(tabs)/announcements',
            });
          }
        }
      });

      // Check events
      eventList.slice(0, 10).forEach((item: any) => {
        const uniqueId = `event_${item.id}`;
        const itemTime = item.created_at ? new Date(item.created_at).getTime() : 0;

        if (!seenIds.includes(uniqueId)) {
          seenIds.push(uniqueId);

          // ONLY trigger a popup if the event was created AFTER our last check AND is recent (within 2h)
          const isNewlyPublished = itemTime > (lastCheckedTime - 30000) && itemTime >= twoHoursAgo;

          if (isNewlyPublished) {
            const eventType = item.event_type || 'Campus Event';
            pendingAlerts.push({
              id: item.id,
              type: 'event',
              category: eventType,
              title: item.title || 'Campus Event',
              body: item.description || (item.venue ? `${eventType} at ${item.venue}` : 'Upcoming campus event'),
              url: '/(tabs)/announcements',
            });
          }
        }
      });

      // Persist updated seen alert IDs and timestamp
      if (seenIds.length > 100) {
        seenIds = seenIds.slice(-100);
      }
      await AsyncStorage.multiSet([
        [SEEN_ALERT_IDS_KEY, JSON.stringify(seenIds)],
        [LAST_CHECKED_TIMESTAMP_KEY, currentTime.toString()],
      ]);

      // 3. Trigger popups & OS tray alerts ONLY for genuine new updates
      if (pendingAlerts.length > 0) {
        // Show in-app banner for the most recent alert
        const primaryAlert = pendingAlerts[0];
        alertListeners.forEach((listener) => {
          try {
            listener(primaryAlert);
          } catch {}
        });

        // Trigger native OS status bar / lock screen notifications if supported
        if (Notifications?.scheduleNotificationAsync) {
          for (const alertItem of pendingAlerts) {
            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: alertItem.title,
                  body: alertItem.body || 'Tap to view details in announcements',
                  data: { url: alertItem.url || '/(tabs)/announcements' },
                  sound: 'default',
                },
                trigger: null,
              });
            } catch (notifErr: any) {
              logger.warn('NOTIFICATIONS', 'OS notification trigger error', notifErr?.message);
            }
          }
        }
      }

      await this.getUnreadCount();
    } catch (err: any) {
      logger.warn('NOTIFICATIONS', 'Error checking for new alerts', err?.message);
    }
  },

  /**
   * Calculate unread notifications count for Announcements & Events
   */
  async getUnreadCount(): Promise<number> {
    try {
      const lastViewed = await AsyncStorage.getItem(LAST_VIEWED_NOTICES_KEY);
      const lastViewedTime = lastViewed ? new Date(lastViewed).getTime() : 0;

      let unread = 0;

      // 1. Check announcements
      try {
        const res = await api.get('/announcements/student');
        const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        list.forEach((item: any) => {
          const itemTime = new Date(item.created_at || item.createdAt || 0).getTime();
          if (itemTime > lastViewedTime) unread++;
        });
      } catch {}

      // 2. Check events
      try {
        const res = await api.get('/events/student');
        const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        list.forEach((item: any) => {
          const itemTime = new Date(item.created_at || item.createdAt || item.event_date || 0).getTime();
          if (itemTime > lastViewedTime) unread++;
        });
      } catch {}

      this.notifyBadgeListeners(unread);
      return unread;
    } catch {
      return 0;
    }
  },

  /**
   * Mark all notifications as seen/read and clear notification badges and tray
   */
  async markAllAsSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_VIEWED_NOTICES_KEY, new Date().toISOString());
      this.notifyBadgeListeners(0);

      // Dismiss OS tray notifications and reset system app icon badge count
      if (Platform.OS !== 'web' && Notifications) {
        try {
          if (Notifications.setBadgeCountAsync) {
            await Notifications.setBadgeCountAsync(0);
          }
        } catch {}
        try {
          if (Notifications.dismissAllNotificationsAsync) {
            await Notifications.dismissAllNotificationsAsync();
          }
        } catch {}
      }
    } catch (err: any) {
      logger.warn('NOTIFICATIONS', 'Failed to mark notifications as seen', err?.message);
    }
  },

  /**
   * Subscribe to badge count updates
   */
  subscribeBadge(listener: BadgeListener): () => void {
    badgeListeners.add(listener);
    return () => badgeListeners.delete(listener);
  },

  notifyBadgeListeners(count: number) {
    badgeListeners.forEach((listener) => {
      try {
        listener(count);
      } catch {}
    });
  },

  /**
   * Subscribe to live in-app alert banners
   */
  subscribeAlert(listener: AlertListener): () => void {
    alertListeners.add(listener);
    return () => alertListeners.delete(listener);
  },
};

export default notificationService;
