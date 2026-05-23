import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Requests push notification permissions and returns the native device
 * push token (FCM on Android, APNs on iOS).
 *
 * Returns null when:
 *  - Running on a simulator (tokens don't work there)
 *  - User denies permission
 *  - Any unexpected error
 *
 * iOS note: Firebase Admin handles APNs tokens if you've uploaded your
 * APNs Auth Key in the Firebase console (Project Settings → Cloud Messaging).
 */
export async function registerForPushNotifications(): Promise<{
  token: string;
  platform: "ios" | "android";
} | null> {
  // Push tokens only work on physical devices
  if (!Device.isDevice) {
    console.log("[push] Skipping — simulator detected");
    return null;
  }

  // Request / check permissions
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[push] Permission denied");
    return null;
  }

  // Android channel setup (required for Android 8+)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // Get the native device token (FCM on Android, APNs on iOS)
  try {
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    return { token, platform: Platform.OS as "ios" | "android" };
  } catch (err) {
    console.error("[push] Failed to get device token:", err);
    return null;
  }
}
