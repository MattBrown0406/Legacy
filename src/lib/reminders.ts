import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Appointment } from '@/types';

const MAP_KEY = 'legacy.reminders.v1'; // appointmentId -> notificationId
const isNative = Platform.OS !== 'web';

// Foreground display behaviour (native only).
if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Ask for notification permission (and set up the Android channel). No-op on web. */
export async function ensureRemindersReady(): Promise<boolean> {
  if (!isNative) return false;
  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (granted && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Appointment reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  return granted;
}

async function loadMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function saveMap(map: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
}

/** Cancel any reminder previously scheduled for this appointment. No-op on web. */
export async function cancelReminder(appointmentId: string): Promise<void> {
  if (!isNative) return;
  const map = await loadMap();
  const notifId = map[appointmentId];
  if (notifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notifId);
    } catch {
      // already fired / gone
    }
    delete map[appointmentId];
    await saveMap(map);
  }
}

/**
 * (Re)schedule the local reminder for an appointment based on its
 * reminder_minutes lead time. Cancels any prior reminder first. No-op on web,
 * or when there is no lead time / the fire time is already in the past.
 */
export async function scheduleReminder(appt: Appointment): Promise<void> {
  if (!isNative) return;
  await cancelReminder(appt.id);
  if (appt.reminder_minutes == null) return;

  const start = new Date(appt.starts_at).getTime();
  const fireAt = new Date(start - appt.reminder_minutes * 60_000);
  if (fireAt.getTime() <= Date.now()) return;

  const granted = await ensureRemindersReady();
  if (!granted) return;

  const timeStr = new Date(appt.starts_at).toLocaleString([], {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
  const body = appt.location ? `${timeStr} · ${appt.location}` : timeStr;

  const notifId = await Notifications.scheduleNotificationAsync({
    content: { title: appt.title, body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
  });

  const map = await loadMap();
  map[appt.id] = notifId;
  await saveMap(map);
}
