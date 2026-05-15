// Path: src/lib/firebase-admin.ts

import * as admin from "firebase-admin";

/**
 * Initializes the Firebase Admin SDK for FCM push notifications.
 *
 * Uses the FIREBASE_SERVICE_ACCOUNT_JSON environment variable, which should be
 * a stringified JSON of the service account key file.
 *
 * Returns null if the environment variable is not set (graceful fallback).
 */
export function getFirebaseAdmin() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON is missing in production. " +
        "Push notifications will not be sent."
      );
    }
    return null;
  }

  try {
    // If already initialized, return the existing app
    if (admin.apps.length > 0) {
      return admin;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    return admin;
  } catch (err) {
    console.error("[firebase-admin] Failed to initialize Firebase Admin SDK:", err);
    return null;
  }
}
