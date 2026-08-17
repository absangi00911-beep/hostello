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

interface FavoriteHostel {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string;
  pricePerMonth: number;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FavoriteCard({ hostel }: { hostel: FavoriteHostel }) {
  return (
    <TouchableOpacity
      style={[styles.card, shadow.card]}
      onPress={() =>
        router.push({ pathname: '/(app)/hostel/[slug]', params: { slug: hostel.slug } })
      }
      accessibilityRole="button"
      accessibilityLabel={`View ${hostel.name} in ${hostel.city}`}
    >
      {hostel.coverImage ? (
        <Image
          source={{ uri: hostel.coverImage }}
          style={styles.cardImage}
          alt={`${hostel.name} hostel photo`}
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
      )}

      <View style={styles.cardBody}>
        <Text style={styles.hostelName} numberOfLines={1}>
          {hostel.name}
        </Text>

        <Text style={styles.locationText}>
          {hostel.city}{hostel.area ? `, ${hostel.area}` : ''}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>
            {formatPKR(hostel.pricePerMonth)}
            <Text style={styles.priceSuffix}> / mo</Text>
          </Text>

          {hostel.rating != null && hostel.rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={colors.primary} />
              <Text style={styles.ratingText}>
                {hostel.rating.toFixed(1)}
                {hostel.reviewCount != null && hostel.reviewCount > 0
                  ? ` (${hostel.reviewCount})`
                  : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteHostel[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<FavoriteHostel[]>('/favorites');
      setFavorites(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load saved hostels.');
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
          <Text style={styles.headerTitle}>Saved</Text>
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
          <Text style={styles.headerTitle}>Saved</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.errorTitle}>Couldn't load saved hostels</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -- Empty state ----------------------------------------------------------
  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.iconRing}>
            <Ionicons name="heart-outline" size={38} color={colors.primaryDeep} aria-hidden={true} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyBody}>
              Tap the heart on any hostel to save it here. Compare your shortlist before you decide.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/(app)/(tabs)/')}
            accessibilityRole="button"
            accessibilityLabel="Browse hostels"
          >
            <Text style={styles.ctaText}>Browse hostels</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -- List -----------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FavoriteCard hostel={item} />}
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
  cardImage: { width: '100%', height: 160 },
  cardImagePlaceholder: { backgroundColor: colors.bgOverlay },
  cardBody: { padding: spacing.md, gap: spacing.xs },
  hostelName: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    color: colors.textHeading,
  },
  locationText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  priceText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.body,
    color: colors.primary,
    fontWeight: fontWeight.semiBold,
  },
  priceSuffix: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
    fontWeight: fontWeight.regular,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
  },
});
