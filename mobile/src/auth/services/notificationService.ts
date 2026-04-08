// Push notification service
// FR-067: Notify users upon challenge completion
// UX-008: Push notifications for challenge completion, badge earned, friend activity, new itinerary
// UX-009: Users shall customize notification preferences

import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from './supabaseClient';

const DEVICE_TOKEN_KEY = 'push_device_token';

export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

// ── Device Token Registration ──────────────────────────────────────────────

export async function registerDeviceToken(token: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const platform = Platform.OS as 'ios' | 'android';

  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      { user_id: user.id, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' },
    );

  if (error) {
    console.warn('[Notifications] Failed to register device token:', error.message);
  } else {
    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
}

export async function unregisterDeviceToken(): Promise<void> {
  const supabase = getSupabaseClient();
  const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('token', token);

  await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
}

// ── Local Notification Queue ───────────────────────────────────────────────
// Stores notifications locally when the app is in the foreground so they
// can be displayed as in-app alerts or a notification feed.

const NOTIFICATION_QUEUE_KEY = 'notification_queue';
const MAX_STORED_NOTIFICATIONS = 50;

export interface StoredNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  created_at: string;
}

export async function getStoredNotifications(): Promise<StoredNotification[]> {
  const raw = await AsyncStorage.getItem(NOTIFICATION_QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function storeNotification(notification: NotificationPayload): Promise<void> {
  const stored = await getStoredNotifications();
  const entry: StoredNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    read: false,
    created_at: new Date().toISOString(),
  };
  const updated = [entry, ...stored].slice(0, MAX_STORED_NOTIFICATIONS);
  await AsyncStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(updated));
}

export async function markNotificationRead(id: string): Promise<void> {
  const stored = await getStoredNotifications();
  const updated = stored.map(n => n.id === id ? { ...n, read: true } : n);
  await AsyncStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(updated));
}

export async function clearNotifications(): Promise<void> {
  await AsyncStorage.removeItem(NOTIFICATION_QUEUE_KEY);
}

// ── In-App Notification Triggers ───────────────────────────────────────────
// Called by app logic (check-in, challenge completion, etc.) to create
// notifications respecting user preferences.

export type NotificationType = 'challenge' | 'badge' | 'friend' | 'leaderboard' | 'marketing';

const PREFERENCE_MAP: Record<NotificationType, string> = {
  challenge: 'notify_challenges',
  badge: 'notify_badges',
  friend: 'notify_friends',
  leaderboard: 'notify_leaderboard',
  marketing: 'notify_marketing',
};

export async function shouldNotify(type: NotificationType): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select(PREFERENCE_MAP[type])
    .eq('user_id', user.id)
    .single();

  if (!prefs) return true; // Default to enabled if prefs not found
  return (prefs as any)[PREFERENCE_MAP[type]] !== false;
}

export async function sendLocalNotification(
  type: NotificationType,
  payload: NotificationPayload,
): Promise<void> {
  const allowed = await shouldNotify(type);
  if (!allowed) return;

  await storeNotification(payload);

  // Show in-app alert as immediate feedback
  Alert.alert(payload.title, payload.body);
}

// ── Convenience triggers ───────────────────────────────────────────────────

export async function notifyCheckIn(locationName: string, points: number): Promise<void> {
  await sendLocalNotification('challenge', {
    title: 'Check-In Successful!',
    body: `You earned ${points} points at ${locationName}!`,
    data: { type: 'check_in' },
  });
}

export async function notifyBadgeEarned(badgeName: string, tier: string): Promise<void> {
  await sendLocalNotification('badge', {
    title: 'Badge Earned!',
    body: `You unlocked the ${tier} ${badgeName} badge!`,
    data: { type: 'badge', badge: badgeName, tier },
  });
}

export async function notifyChallengeComplete(challengeName: string, reward: number): Promise<void> {
  await sendLocalNotification('challenge', {
    title: 'Challenge Complete!',
    body: `You completed "${challengeName}" and earned ${reward} bonus points!`,
    data: { type: 'challenge', challenge: challengeName },
  });
}

export async function notifyLeaderboardRankChange(newRank: number): Promise<void> {
  await sendLocalNotification('leaderboard', {
    title: 'Leaderboard Update',
    body: `You moved up to rank #${newRank}!`,
    data: { type: 'leaderboard', rank: String(newRank) },
  });
}
