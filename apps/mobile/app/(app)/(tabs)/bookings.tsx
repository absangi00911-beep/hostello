import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  colors,
  fontFamily,
  fontSize,
  radius,
  shadow,
  spacing,
} from '../../../src/theme';

export default function BookingsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Empty state */}
      <View style={styles.emptyState}>
        <View style={styles.iconRing}>
          <Ionicons
            name="calendar-outline"
            size={38}
            color={colors.primaryDeep}
            aria-hidden="true"
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyBody}>
            Your confirmed stays will appear here. Find a hostel and book your
            first room.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/(app)/(tabs)/')}
          accessibilityRole="button"
          accessibilityLabel="Explore hostels"
        >
          <Text style={styles.ctaText}>Explore hostels</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgCard,
    ...shadow.card,
  },
  headerTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    color: colors.textHeading,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxxl,
    gap: spacing.xl,
  },

  iconRing: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    color: colors.textHeading,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fontSize.body * 1.65,
  },

  ctaButton: {
    backgroundColor: colors.action,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md + 2,
  },
  ctaText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.body,
    color: colors.textInverse,
    fontWeight: '600',
  },
});
