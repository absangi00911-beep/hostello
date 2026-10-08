import { useCallback, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/context/AuthContext';
import { useFonts } from '../src/hooks/useFonts';
import { apiRequest } from '../src/services/api';
import { getNotificationDestination } from '../src/services/notification-routing';

// Show notifications as banners even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function NotificationResponseHandler() {
  const { token, isLoading } = useAuth();
  const pendingResponse = useRef<Notifications.NotificationResponse | null>(null);
  const lastHandled = useRef<{ id: string; at: number } | null>(null);

  const handleResponse = useCallback((response: Notifications.NotificationResponse) => {
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const notification = response.notification;
    const requestId = notification.request.identifier;
    const last = lastHandled.current;
    if (last?.id === requestId && Date.now() - last.at < 1_500) return;

    if (isLoading || !token) {
      pendingResponse.current = response;
      return;
    }

    lastHandled.current = { id: requestId, at: Date.now() };
    pendingResponse.current = null;

    const payload = notification.request.content.data;
    const data = payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : {};
    const destination = getNotificationDestination(data);

    if (typeof data.notificationId === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(data.notificationId)) {
      void apiRequest(`/notifications/${data.notificationId}`, { method: 'PUT' }).catch(() => {});
    }

    switch (destination.kind) {
      case 'conversation':
        router.push({ pathname: '/(app)/conversation/[id]', params: { id: destination.conversationId } });
        break;
      case 'messages':
        router.push('/(app)/(tabs)/messages');
        break;
      case 'bookings':
        router.push('/(app)/(tabs)/bookings');
        break;
      case 'notifications':
        router.push('/(app)/(tabs)/notifications');
        break;
    }

    void Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [isLoading, token]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch(() => {});

    return () => subscription.remove();
  }, [handleResponse]);

  useEffect(() => {
    if (pendingResponse.current && !isLoading && token) {
      handleResponse(pendingResponse.current);
    }
  }, [handleResponse, isLoading, token]);

  return null;
}

// Keep the splash screen visible while fonts are loading.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const fontsLoaded = useFonts();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Don't render until fonts are ready — avoids a flash of unstyled text.
  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <NotificationResponseHandler />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
