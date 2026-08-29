import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  registerPushToken,
  unregisterPushToken,
} from "@/services/owner/notifications";

const TOKEN_STORAGE_KEY = "kazione.expo_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type PushPlatform = "ios" | "android";

export function pushPlatform(): PushPlatform {
  return Platform.OS === "ios" ? "ios" : "android";
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#E84E26",
  });
}

/**
 * Request permission and return an Expo push token, or null if unavailable
 * (simulator, permission denied, missing EAS projectId).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) {
      console.warn("[push] Skipping — physical device required for remote push");
    }
    return null;
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    if (__DEV__) {
      console.warn("[push] Permission not granted");
    }
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId || typeof projectId !== "string") {
    console.warn("[push] Missing EAS projectId in app config");
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data ?? null;
}

/** Persist token locally and register with backend (no-op if backend not ready). */
export async function syncPushTokenWithBackend(
  token: string,
): Promise<boolean> {
  try {
    await registerPushToken(token, pushPlatform());
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    return true;
  } catch (err) {
    // Backend MPUSH endpoints may not be deployed yet — never crash the app.
    if (__DEV__) {
      console.warn("[push] register-push-token failed:", err);
    }
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    return false;
  }
}

export async function unregisterCurrentPushToken(): Promise<void> {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return;
  try {
    await unregisterPushToken(token);
  } catch (err) {
    if (__DEV__) {
      console.warn("[push] unregister-push-token failed:", err);
    }
  } finally {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export {
  parseStaffPushData,
  staffHrefForPushData,
  type StaffPushData,
} from "@/lib/pushRouting";
