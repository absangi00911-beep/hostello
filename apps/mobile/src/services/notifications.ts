import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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
