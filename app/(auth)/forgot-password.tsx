import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import { resetPassword } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const { error: resetErr } = await resetPassword(email.trim());
      if (resetErr) {
        setError(resetErr.message);
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>Reset password</Text>
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? (
          <Text style={styles.success}>
            Check your inbox for a password reset link.
          </Text>
        ) : null}
        <Button label="Send Reset Link" onPress={() => void submit()} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
    justifyContent: 'center',
  },
  heading: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
  success: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
  },
});
