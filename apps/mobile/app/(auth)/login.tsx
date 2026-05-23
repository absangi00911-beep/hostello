import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { login } from '../../src/services/auth';
import { useAuth } from '../../src/context/AuthContext';
import { colors, fontSize, spacing } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  // Read the success message passed as a route param from the register screen
  const { message } = useLocalSearchParams<{ message?: string }>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, password });
      // Pass both token and user so the Profile tab can display account info
      await signIn(response.token, response.user);
      // AuthContext route-guard will redirect to /(app) automatically
    } catch (err: unknown) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Success message passed from register screen */}
      {message ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{message}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}

      {/* Forgot password link */}
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push('/(auth)/forgot-password')}
        accessibilityRole="link"
      >
        <Text style={styles.linkText}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Register link */}
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push('/(auth)/register')}
        accessibilityRole="link"
      >
        <Text style={styles.linkText}>
          Don't have an account?{' '}
          <Text style={styles.linkTextBold}>Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  input: { borderWidth: 1, padding: spacing.md, marginBottom: spacing.lg, borderRadius: 5 },
  successBanner: {
    backgroundColor: colors.successBg,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  successText: {
    color: colors.successText,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  linkText: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  linkTextBold: {
    color: colors.textLink,
    fontWeight: '600',
  },
});