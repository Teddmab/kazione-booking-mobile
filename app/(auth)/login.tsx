import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import { signInWithEmail } from '@/lib/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: signErr } = await signInWithEmail(email.trim(), password);
      if (signErr) {
        setError(signErr.message);
      }
      // AuthGate + app/index.tsx handle navigation after session is set
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error — check your connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Sign in to KaziOne</Text>
        <Text style={styles.subheading}>For owners, managers, staff, and reception</Text>
        <Input
          label="Work email"
          placeholder="owner@yoursalon.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Sign In" onPress={() => void submit()} loading={loading} size="lg" />
        <Link href={'/(auth)/forgot-password' as Href} asChild>
          <Pressable>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
    justifyContent: 'center',
  },
  heading: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subheading: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  link: {
    ...TYPOGRAPHY.body,
    color: COLORS.gold,
    textAlign: 'center',
  },
});
