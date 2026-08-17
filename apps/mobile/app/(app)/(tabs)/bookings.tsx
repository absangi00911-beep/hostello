import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiRequest } from '../../../src/services/api';
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
} from '../../../src/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingHostel {
  id: string;
  name: string;
  slug: string;
  coverImage?: string;
  city: string;
}

interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount?: number;
  paymentStatus?: string;
  createdAt: string;
  hostel: BookingHostel;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

const STATUS_CONFIG: Record<
  Booking['status'],
  { label: string; bg: string; text: string }
> = {
  PENDING:   { label: 'Pending',   bg: colors.warningBg,   text: colors.warningText },
  CONFIRMED: { label: 'Confirmed', bg: colors.successBg,   text: colors.successText },
  CANCELLED: { label: 'Cancelled', bg: colors.errorBg,     text: colors.errorText },
  COMPLETED: { label: 'Completed', bg: colors.bgOverlay,   text: colors.textMuted },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BookingCard({ booking }: { booking: Booking }) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING;

  return (
    <TouchableOpacity
      style={[styles.card, shadow.card]}
      onPress={() =>
        router.push({ pathname: '/(app)/hostel/[slug]', params: { slug: booking.hostel.slug } })
      }
      accessibilityRole="button"
      accessibilityLabel={`Booking at ${booking.hostel.name}, status ${cfg.label}`}
    >
      {booking.hostel.coverImage ? (
        <Image
          source={{ uri: booking.hostel.coverImage }}
          style={styles.cardImage}
          alt={`${booking.hostel.name} hostel photo`}
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.hostelName} numberOfLines={1}>
            {booking.hostel.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={styles.cityText}>{booking.hostel.city}</Text>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={styles.dateText}>
            {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
          </Text>
        </View>

        {booking.totalAmount != null && (
          <Text style={styles.amountText}>{formatPKR(booking.totalAmount)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<Booking[]>('/bookings');
      setBookings(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // -- Loading state --------------------------------------------------------
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // -- Error state ----------------------------------------------------------
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.errorTitle}>Couldn't load bookings</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -- Empty state ----------------------------------------------------------
  if (bookings.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.iconRing}>
            <Ionicons name="calendar-outline" size={38} color={colors.primaryDeep} aria-hidden={true} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyBody}>
              Your confirmed stays will appear here. Find a hostel and book your first room.
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

  // -- List -----------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgPage },

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

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },

  errorTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    color: colors.textHeading,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  retryText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.body,
    color: colors.textInverse,
    fontWeight: fontWeight.semiBold,
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
  textBlock: { alignItems: 'center', gap: spacing.sm },
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
    fontWeight: fontWeight.semiBold,
  },

  list: { padding: spacing.md, gap: spacing.sm },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 140 },
  cardImagePlaceholder: { backgroundColor: colors.bgOverlay },
  cardBody: { padding: spacing.md, gap: spacing.xs },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  hostelName: {
    flex: 1,
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    color: colors.textHeading,
  },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
  },
  cityText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  dateText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
  },
  amountText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.body,
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
    marginTop: spacing.xs,
  },
});
