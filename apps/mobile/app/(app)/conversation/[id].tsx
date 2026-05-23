import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack } from 'expo-router';
import { apiRequest } from '../../../src/services/api';
import { useAuth } from '../../../src/context/AuthContext';
import {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from '../../../src/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MessageSender {
  id: string;
  name: string;
  avatar: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: MessageSender;
}

interface ConversationDetail {
  id: string;
  hostelName: string;
  messages: Message[];
  participants: { userId: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && (
          <Text style={styles.senderName}>{message.sender.name}</Text>
        )}
        <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
          {message.content}
        </Text>
        <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ConversationScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { user } = useAuth();

  const [messages, setMessages]   = useState<Message[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [content, setContent]     = useState('');
  const [sending, setSending]     = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const listRef = useRef<FlatList<Message>>(null);

  // -- Load messages --------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<ConversationDetail>(`/conversations/${id}`);
      setMessages(data.messages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Scroll to bottom after messages load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [loading, messages.length]);

  // -- Send message ---------------------------------------------------------
  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);

    try {
      const newMessage = await apiRequest<Message>(`/conversations/${id}`, {
        method: 'POST',
        body: JSON.stringify({ content: trimmed }),
      });
      setMessages((prev) => [...prev, newMessage]);
      setContent('');
      // Scroll to the newly appended message
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }, [content, id, sending]);

  // -- Loading state --------------------------------------------------------
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: title ?? 'Conversation' }} />
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
        <Stack.Screen options={{ title: title ?? 'Conversation' }} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.errorTitle}>Couldn't load conversation</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -- Thread ---------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: title ?? 'Conversation' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.senderId === user?.id}
            />
          )}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyThread}>
              <Text style={styles.emptyThreadText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        {/* Send error */}
        {sendError !== null && (
          <View style={styles.sendErrorBox}>
            <Text style={styles.sendErrorText}>{sendError}</Text>
          </View>
        )}

        {/* Compose bar */}
        <View style={styles.composeBar}>
          <TextInput
            style={styles.composeInput}
            placeholder="Type a message…"
            placeholderTextColor={colors.textPlaceholder}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={2000}
            returnKeyType="default"
            accessibilityLabel="Message input"
          />
          <TouchableOpacity
            style={[styles.sendButton, (!content.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!content.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {sending
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Ionicons name="send" size={18} color={colors.textInverse} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgPage },
  flex:     { flex: 1 },

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

  messageList:   { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },

  emptyThread:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxxl },
  emptyThreadText: { fontFamily: fontFamily.body, fontSize: fontSize.body, color: colors.textMuted },

  // Message bubbles
  bubbleRow:    { flexDirection: 'row', marginBottom: spacing.sm },
  bubbleRowOwn: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  bubbleOther: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderBottomLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.primaryDark,
    fontWeight: fontWeight.semiBold,
    marginBottom: 2,
  },
  bubbleText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
    color: colors.textHeading,
    lineHeight: fontSize.body * 1.4,
  },
  bubbleTextOwn: { color: colors.textInverse },
  bubbleTime: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.textMuted,
    alignSelf: 'flex-end',
  },
  bubbleTimeOwn: { color: 'rgba(255,255,255,0.7)' },

  // Send error
  sendErrorBox: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  sendErrorText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.bodySm,
    color: colors.errorText,
  },

  // Compose bar
  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.bgCard,
  },
  composeInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
    color: colors.textHeading,
    backgroundColor: colors.bgPage,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: { opacity: 0.4 },
});