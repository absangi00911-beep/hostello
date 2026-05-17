import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import {
  colors,
  fontFamily,
  fontSize,
  radius,
  shadow,
  spacing,
} from '../../../src/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsRowProps {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
  destructive?: boolean;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SettingsRow({
  icon,
  label,
  onPress,
  showDivider = false,
  destructive = false,
}: SettingsRowProps) {
  return (
    <>
      <TouchableOpacity
        style={styles.settingsRow}
        onPress={onPress}
        activeOpacity={0.65}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.settingsRowLeft}>
          <View
            style={[
              styles.settingsIconWrap,
              destructive && styles.settingsIconWrapDestructive,
            ]}
          >
            <Ionicons
              name={icon}
              size={18}
              color={destructive ? colors.error : colors.primaryDeep}
              aria-hidden="true"
            />
          </View>
          <Text
            style={[
              styles.settingsLabel,
              destructive && styles.settingsLabelDestructive,
            ]}
          >
            {label}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textMuted}
          aria-hidden="true"
        />
      </TouchableOpacity>
      {showDivider && <View style={styles.rowDivider} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function humanRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* ── Avatar + identity ──────────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>

          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>

          {user?.role && user.role !== 'STUDENT' && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{humanRole(user.role)}</Text>
            </View>
          )}

          {user && !user.emailVerified && (
            <View style={styles.unverifiedBadge}>
              <Ionicons
                name="alert-circle-outline"
                size={13}
                color={colors.warningText}
                aria-hidden="true"
              />
              <Text style={styles.unverifiedText}>Email not verified</Text>
            </View>
          )}
        </View>

        {/* ── Account section ────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={[styles.settingsCard, shadow.card]}>
            <SettingsRow
              icon="person-outline"
              label="Edit profile"
              onPress={() => {}}
              showDivider
            />
            <SettingsRow
              icon="lock-closed-outline"
              label="Change password"
              onPress={() => {}}
              showDivider
            />
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* ── Support section ────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={[styles.settingsCard, shadow.card]}>
            <SettingsRow
              icon="help-circle-outline"
              label="Help & FAQ"
              onPress={() => {}}
              showDivider
            />
            <SettingsRow
              icon="chatbubble-outline"
              label="Contact us"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* ── Sign out section ───────────────────────────── */}
        <View style={[styles.section, styles.sectionLast]}>
          <View style={[styles.settingsCard, shadow.card]}>
            <SettingsRow
              icon="log-out-outline"
              label="Sign out"
              onPress={handleSignOut}
              destructive
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ICON_WRAP_SIZE = 34;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgCard,
  },
  headerTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    color: colors.textHeading,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFaint,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    color: colors.primaryDeep,
    lineHeight: fontSize.h1 * 1.1,
  },
  userName: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    color: colors.textHeading,
  },
  userEmail: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
  roleBadge: {
    marginTop: spacing.xs,
    backgroundColor: colors.primaryFaint,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  roleBadgeText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.primaryDeep,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    backgroundColor: colors.warningBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: '#EDD88A',
  },
  unverifiedText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.warningText,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionLast: {
    marginBottom: spacing.xxxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },

  // Settings card
  settingsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsIconWrap: {
    width: ICON_WRAP_SIZE,
    height: ICON_WRAP_SIZE,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconWrapDestructive: {
    backgroundColor: colors.errorBg,
  },
  settingsLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.body,
    color: colors.textBody,
  },
  settingsLabelDestructive: {
    color: colors.error,
  },
  // Indented divider — starts after icon to avoid a full-bleed line
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginLeft: spacing.lg + ICON_WRAP_SIZE + spacing.md,
  },
});
