// Converted from app.json on 2026-08-08 so googleServicesFile can resolve
// from an EAS file-type environment variable during cloud builds, falling
// back to the local gitignored file for `expo prebuild`/local dev builds.
// See: https://docs.expo.dev/eas/environment-variables/faq/#can-i-use-file-environment-variables-in-my-eas-project
//
// NOTE: local fallback paths below assume google-services.json sits at the
// app root (apps/mobile/google-services.json) — the standard location for a
// config-plugin (non-bare) Expo project. Adjust if yours lives elsewhere.

module.exports = {
  expo: {
    name: "HostelLo",
    slug: "hostello",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "hostello",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "com.hostello.app",
      supportsTablet: true,
      associatedDomains: [
        "applinks:hostello.pk",
        "applinks:www.hostello.pk",
      ],
      // Doesn't exist locally yet — this line is inert until the file shows
      // up (either locally or via the EAS env var below). See prose reply
      // for the Firebase console steps to actually obtain it.
      googleServicesFile:
        process.env.GOOGLE_SERVICES_INFO_PLIST ?? "./GoogleService-Info.plist",
    },
    android: {
      package: "com.hostello.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "https", host: "hostello.pk", pathPrefix: "/booking" },
            { scheme: "https", host: "hostello.pk", pathPrefix: "/payment" },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "@react-native-community/datetimepicker",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#2A6545",
          sounds: [],
        },
      ],
    ],
  },
};