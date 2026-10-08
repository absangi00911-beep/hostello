import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiRequest } from '../../../src/services/api';
import { getNotificationDestination } from '../../../src/services/notification-routing';
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from '../../../src/theme';

interface MobileNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  bookingId: string | null;
  reviewId: string | null;
  hostelId: string | null;
  read: boolean;
  createdAt: string;
}

function iconFor(type: string): React.ComponentProps<typeof Ionicons>['name'] {
  if (type.startsWith('BOOKING_')) return 'calendar-outline';
  if (type === 'MESSAGE_RECEIVED') return 'chatbubble-outline';
  if (type === 'REVIEW_RECEIVED') return 'star-outline';
  if (type === 'PRICE_ALERT') return 'trending-down-outline';
  return 'notifications-outline';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function openDestination(notification: MobileNotification) {
  const destination = getNotificationDestination({ type: notification.type });
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
      break;
  }
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<MobileNotification[]>('/notifications?limit=100');
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiRequest('/notifications', {
        method: 'PUT',
        body: JSON.stringify({ action: 'read-all' }),
      });
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    } catch (err) {
      Alert.alert('Could not update notifications', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setMarkingAll(false);
    }
  };

  const openNotification = async (item: MobileNotification) => {
    if (!item.read) {
      setNotifications((items) => items.map((current) => current.id === item.id ? { ...current, read: true } : current));
      void apiRequest(`/notifications/${item.id}`, { method: 'PUT' }).catch(() => {});
    }
    openDestination(item);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={21} color={colors.textHeading} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Your booking and account updates</Text>
        </View>
        <TouchableOpacity
          onPress={() => void markAllRead()}
          disabled={markingAll || notifications.every((item) => item.read)}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          style={styles.readAllButton}
        >
          {markingAll ? <ActivityIndicator size="small" color={colors.primary} /> : (
            <Ionicons name="checkmark-done-outline" size={21} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.emptyTitle}>Couldn’t load notifications</Text>
          <Text style={styles.emptyBody}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-outline" size={34} color={colors.primaryDeep} />
          </View>
          <Text style={styles.emptyTitle}>You’re all caught up</Text>
          <Text style={styles.emptyBody}>Booking and account updates will show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, !item.read && styles.rowUnread]}
              onPress={() => void openNotification(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.message}`}
            >
              <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
                <Ionicons name={iconFor(item.type)} size={19} color={colors.primaryDeep} />
              </View>
              <View style={styles.rowContent}>
                <View style={styles.rowHeading}>
                  <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    minHeight: 78,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontFamily: fontFamily.heading, fontSize: fontSize.h2, color: colors.textHeading },
  subtitle: { marginTop: 2, fontSize: fontSize.caption, color: colors.textMuted },
  readAllButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  row: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowUnread: { backgroundColor: colors.primaryFaint, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.md },
  iconWrap: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.bgOverlay, alignItems: 'center', justifyContent: 'center' },
  iconWrapUnread: { backgroundColor: colors.bgCard },
  rowContent: { flex: 1, gap: 4 },
  rowHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowTitle: { flex: 1, fontSize: fontSize.body, fontWeight: fontWeight.medium, color: colors.textHeading },
  rowTitleUnread: { fontWeight: fontWeight.bold },
  date: { fontSize: fontSize.caption, color: colors.textMuted },
  message: { fontSize: fontSize.bodySm, lineHeight: 19, color: colors.textBody },
  unreadDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  separator: { height: 1, backgroundColor: colors.borderSubtle },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  emptyIcon: { width: 68, height: 68, borderRadius: radius.full, backgroundColor: colors.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fontFamily.heading, fontSize: fontSize.h3, color: colors.textHeading, textAlign: 'center' },
  emptyBody: { fontSize: fontSize.body, lineHeight: 22, color: colors.textMuted, textAlign: 'center' },
  retryButton: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primary },
  retryText: { color: colors.bgCard, fontWeight: fontWeight.semiBold },
});
