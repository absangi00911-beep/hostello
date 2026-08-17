import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="hostel/[slug]" />
      <Stack.Screen name="booking/[id]/index" />
      <Stack.Screen name="conversation/[id]" />
    </Stack>
  );
}
