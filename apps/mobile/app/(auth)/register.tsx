import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { apiRequest } from '../../src/services/api';
import { colors, fontSize, fontWeight, spacing, radius } from '../../src/theme';

type Role = 'STUDENT' | 'OWNER';

export default function RegisterScreen() {
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role,            setRole]            = useState<Role>('STUDENT');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);

    // Client-side: confirm password match — never sent to the server
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      // Navigate to login and pass the success message as a route param
      router.replace({
        pathname: '/(auth)/login',
        params: { message: 'Account created. Please verify your email before logging in.' },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Create account</Text>

      {/* Full name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor={colors.textPlaceholder}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Email */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textPlaceholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
      </View>

      {/* Password */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          placeholderTextColor={colors.textPlaceholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* Confirm password */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          style={styles.input}
          placeholder="Repeat your password"
          placeholderTextColor={colors.textPlaceholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      {/* Role toggle — TouchableOpacity tiles, no library required */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>I am a…</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleTile, role === 'STUDENT' && styles.roleTileActive]}
            onPress={() => setRole('STUDENT')}
            accessibilityRole="radio"
            accessibilityState={{ checked: role === 'STUDENT' }}
            accessibilityLabel="Student"
          >
            <Text style={[styles.roleTileText, role === 'STUDENT' && styles.roleTileTextActive]}>
              Student
            </Text>
            <Text style={[styles.roleTileDesc, role === 'STUDENT' && styles.roleTileDescActive]}>
              Looking for a hostel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleTile, role === 'OWNER' && styles.roleTileActive]}
            onPress={() => setRole('OWNER')}
            accessibilityRole="radio"
            accessibilityState={{ checked: role === 'OWNER' }}
            accessibilityLabel="Owner"
          >
            <Text style={[styles.roleTileText, role === 'OWNER' && styles.roleTileTextActive]}>
              Owner
            </Text>
            <Text style={[styles.roleTileDesc, role === 'OWNER' && styles.roleTileDescActive]}>
              Listing a hostel
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline error — shown on submit, covers both client and server errors */}
      {error !== null && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Submit */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.action} style={styles.spinner} />
      ) : (
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleRegister}
          accessibilityRole="button"
          accessibilityLabel="Create account"
        >
          <Text style={styles.submitText}>Create account</Text>
        </TouchableOpacity>
      )}

      {/* Back to login */}
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.back()}
        accessibilityRole="link"
      >
        <Text style={styles.linkText}>
          Already have an account?{' '}
          <Text style={styles.linkTextBold}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: colors.bgPage },
  container:  { padding: spacing.xl, justifyContent: 'center', flexGrow: 1 },
  heading:    {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textHeading,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },

  // Field groups
  fieldGroup:  { marginBottom: spacing.lg },
  label:       { fontSize: fontSize.bodySm, fontWeight: fontWeight.medium, color: colors.textBody, marginBottom: spacing.xs },
  input:       {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.body,
    color: colors.textHeading,
    backgroundColor: colors.bgCard,
  },

  // Role tiles
  roleRow:              { flexDirection: 'row', gap: spacing.md },
  roleTile:             {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
  },
  roleTileActive:       { borderColor: colors.primary, backgroundColor: colors.primaryFaint },
  roleTileText:         { fontSize: fontSize.body, fontWeight: fontWeight.semiBold, color: colors.textMuted },
  roleTileTextActive:   { color: colors.primaryDark },
  roleTileDesc:         { fontSize: fontSize.caption, color: colors.textPlaceholder, marginTop: spacing.xs, textAlign: 'center' },
  roleTileDescActive:   { color: colors.primaryDark },

  // Error
  errorBox:   {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText:  { fontSize: fontSize.bodySm, color: colors.errorText },

  // Submit
  spinner:      { marginBottom: spacing.lg },
  submitButton: {
    backgroundColor: colors.action,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  submitText:   { fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold, color: colors.textInverse },

  // Navigation link
  linkButton:   { alignItems: 'center', paddingVertical: spacing.xs },
  linkText:     { fontSize: fontSize.body, color: colors.textMuted, textAlign: 'center' },
  linkTextBold: { color: colors.textLink, fontWeight: fontWeight.semiBold },
});