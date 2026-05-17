import { Stack } from 'expo-router';
import { colors, fontFamily, fontSize } from '../../src/theme';

/**
 * (app) is a Stack navigator so that hostel-detail and booking screens
 * push on top of the tab bar (hiding it) rather than rendering inside a tab.
 *
 * Screen hierarchy:
 *   (app)/
 *     (tabs)/          ← Tab navigator — always the "home base"
 *       index          ← Explore
 *       bookings       ← My Bookings
 *       favorites      ← Saved
 *       profile        ← Profile
 *     hostel/[slug]    ← Detail screen — pushes over tabs
 *     booking/[id]     ← Booking flow — pushes over tabs
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.primaryDeep,
        headerTitleStyle: {
          fontFamily: fontFamily.headingSemi,
          fontSize: fontSize.h4,
          color: colors.textHeading,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: colors.bgPage },
      }}
    >
      {/* Tab navigator — no header at this level */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Detail screens — these get their own header from Stack.Screen options
          inside the screen file via <Stack.Screen options={{ title: '...' }} /> */}
      <Stack.Screen
        name="hostel/[slug]"
        options={{ title: 'Hostel details' }}
      />
      <Stack.Screen
        name="booking/[id]/index"
        options={{ title: 'Book a stay' }}
      />
    </Stack>
  );
}
