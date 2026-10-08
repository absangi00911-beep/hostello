import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const REGISTERED_PUSH_TOKEN_KEY = "registered_push_token";

/**
 * Requests push notification permissions and returns the native device
 * push token (FCM on Android, APNs on iOS).
 *
 * Returns null when:
 *  - Running on a simulator, where push tokens do not work
 *  - User denies permission
 *  - Any unexpected error occurs
 *
 * iOS note: Firebase Admin handles APNs tokens if the APNs Auth Key has been
 * uploaded in Firebase console under Project Settings > Cloud Messaging.
 */
export async function registerForPushNotifications(): Promise<{
  token: string;
  platform: "ios" | "android";
} | null> {
  if (!Device.isDevice) {
    console.warn("[push] Skipping - simulator detected");
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[push] Permission denied");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    return { token, platform: Platform.OS as "ios" | "android" };
  } catch (err) {
    console.error("[push] Failed to get device token:", err);
    return null;
  }
}

export function getRegisteredPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REGISTERED_PUSH_TOKEN_KEY);
}

export function saveRegisteredPushToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(REGISTERED_PUSH_TOKEN_KEY, token);
}

export function clearRegisteredPushToken(): Promise<void> {
  return SecureStore.deleteItemAsync(REGISTERED_PUSH_TOKEN_KEY);
}

/** Read an existing token during sign-out without opening a permission prompt. */
export async function getPushTokenIfPermissionGranted(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return null;

  try {
    const { data } = await Notifications.getDevicePushTokenAsync();
    return typeof data === "string" ? data : null;
  } catch (err) {
    console.warn("[push] Could not read the existing device token:", err);
    return null;
  }
}
