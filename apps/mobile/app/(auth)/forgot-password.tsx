import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { apiRequest } from '../../src/services/api';
import { colors, fontSize, fontWeight, spacing, radius } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    setLoading(true);
    try {
      // apiRequest returns json.data — the forgot-password route returns
      // { message } with no data field, so the return value is undefined.
      // Success = no throw. We never navigate away regardless of outcome.
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      // Show the inline confirmation — never navigate
      setSubmitted(true);
    } catch (err: unknown) {
      // Only fires on genuine server errors (5xx). The route never reveals
      // whether an email exists — it always returns 200 for valid/invalid emails.
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reset password</Text>
      <Text style={styles.subheading}>
        Enter your email and we'll send you a link to reset your password.
      </Text>

      {/* Inline confirmation — shown after any 2xx, never navigates away */}
      {submitted ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            If that email is registered, you'll receive a reset link shortly.
          </Text>
        </View>
      ) : (
        <>
          {/* Email field */}
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

          {/* Inline error */}
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
              onPress={handleSubmit}
              accessibilityRole="button"
              accessibilityLabel="Send reset link"
            >
              <Text style={styles.submitText}>Send reset link</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Back to login */}
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.back()}
        accessibilityRole="link"
      >
        <Text style={styles.linkText}>
          Back to{' '}
          <Text style={styles.linkTextBold}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, padding: spacing.xl, justifyContent: 'center', backgroundColor: colors.bgPage },
  heading:     {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textHeading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subheading:  {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: fontSize.body * 1.5,
  },

  // Field
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

  // Success
  successBox:  {
    backgroundColor: colors.successBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  successText: { fontSize: fontSize.body, color: colors.successText, textAlign: 'center', lineHeight: fontSize.body * 1.5 },

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