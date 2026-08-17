import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
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

interface MessagePreview {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null };
}

interface Conversation {
  id: string;
  hostelName: string;
  updatedAt: string;
  unreadCount: number;
  messages: MessagePreview[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const lastMessage = conversation.messages[0] ?? null;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity
      style={[styles.row, shadow.card]}
      onPress={() =>
        router.push({
          pathname: '/(app)/conversation/[id]',
          params: { id: conversation.id, title: conversation.hostelName },
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`Conversation about ${conversation.hostelName}`}
    >
      {/* Avatar placeholder */}
      <View style={styles.avatar}>
        <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.hostelName, hasUnread && styles.hostelNameUnread]} numberOfLines={1}>
            {conversation.hostelName}
          </Text>
          <Text style={styles.time}>
            {timeAgo(conversation.updatedAt)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
            {lastMessage ? `${lastMessage.sender.name}: ${lastMessage.content}` : 'No messages yet'}
          </Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
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

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<Conversation[]>('/conversations');
      setConversations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations.');
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
          <Text style={styles.headerTitle}>Messages</Text>
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
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.errorTitle}>Couldn't load messages</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -- Empty state ----------------------------------------------------------
  if (conversations.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.iconRing}>
            <Ionicons name="chatbubble-outline" size={38} color={colors.primaryDeep} aria-hidden={true} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.emptyTitle}>No conversations yet.</Text>
            <Text style={styles.emptyBody}>
              Message a hostel owner from a hostel page to start a conversation.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // -- List -----------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConversationRow conversation={item} />}
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

  list: { padding: spacing.md, gap: spacing.sm },

  // Conversation row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1, gap: spacing.xs },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  hostelName: {
    flex: 1,
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.body,
    color: colors.textHeading,
    fontWeight: fontWeight.medium,
  },
  hostelNameUnread: { fontWeight: fontWeight.bold },
  time: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    flexShrink: 0,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  preview: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
  },
  previewUnread: {
    color: colors.textBody,
    fontWeight: fontWeight.medium,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 11,
    color: colors.textInverse,
    fontWeight: fontWeight.bold,
  },
});
