import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { apiRequest } from '../../../src/services/api';
import { colors, fontSize, fontWeight, radius, spacing, shadow } from '../../../src/theme';

interface HostelDetail {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string;
  description?: string;
  pricePerMonth: number;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
}

export default function HostelDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [hostel, setHostel] = useState<HostelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    apiRequest<HostelDetail>(`/hostels/${slug}`)
      .then((data) => {
        setHostel(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !hostel) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't load hostel</Text>
        <Text style={styles.errorBody}>{error ?? 'Hostel not found.'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: hostel.name, headerBackTitle: 'Back' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {hostel.coverImage ? (
          <Image source={{ uri: hostel.coverImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        <View style={styles.body}>
          <Text style={styles.name}>{hostel.name}</Text>
          <Text style={styles.location}>
            {hostel.city}{hostel.area ? `, ${hostel.area}` : ''}
          </Text>

          <Text style={styles.price}>
            Rs. {hostel.pricePerMonth.toLocaleString('en-PK')}
            <Text style={styles.priceSuffix}> / month</Text>
          </Text>

          {hostel.description ? (
            <Text style={styles.description}>{hostel.description}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() =>
            router.push({ pathname: '/(app)/booking/[id]', params: { id: hostel.id } })
          }
          accessibilityRole="button"
          accessibilityLabel="Book this hostel"
        >
          <Text style={styles.ctaText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgPage },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.bgPage,
  },

  image: { width: '100%', height: 260 },
  imagePlaceholder: { backgroundColor: colors.bgOverlay },

  body: { padding: spacing.lg, gap: spacing.sm },

  name: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textHeading,
  },
  location: {
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
  price: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  priceSuffix: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: colors.textMuted,
  },
  description: {
    fontSize: fontSize.body,
    color: colors.textBody,
    lineHeight: fontSize.body * 1.6,
    marginTop: spacing.sm,
  },

  errorTitle: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    color: colors.textHeading,
    marginBottom: spacing.sm,
  },
  errorBody: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  backButtonText: {
    color: colors.textInverse,
    fontWeight: fontWeight.semiBold,
    fontSize: fontSize.body,
  },

  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    backgroundColor: colors.bgCard,
    ...shadow.card,
  },
  ctaButton: {
    backgroundColor: colors.action,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.textInverse,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
});