import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import { signUpWithEmail } from '@/lib/auth';

type Lang = 'en' | 'fr' | 'et';

const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  fr: 'Français',
  et: 'Eesti',
};

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<Lang>('en');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: signErr } = await signUpWithEmail(
        email.trim(),
        password,
        name.trim(),
        language,
      );
      if (signErr) {
        setError(
          signErr.message.includes('already')
            ? 'This email is already in use.'
            : signErr.message,
        );
        return;
      }
      router.replace('/(auth)/check-email' as Href);
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
        <Text style={styles.heading}>Create account</Text>
        <Input label="Full name" placeholder="Your name" value={name} onChangeText={setName} />
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Input
          label="Password"
          placeholder="Min. 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Text style={styles.langLabel}>Language</Text>
        <View style={styles.langRow}>
          {(Object.keys(LANG_LABELS) as Lang[]).map((lang) => (
            <Pressable
              key={lang}
              style={[styles.langChip, language === lang && styles.langChipActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text
                style={[styles.langChipText, language === lang && styles.langChipTextActive]}
              >
                {LANG_LABELS[lang]}
              </Text>
            </Pressable>
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Create Account" onPress={() => void submit()} loading={loading} />
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
  },
  langLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
  },
  langRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langChipActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(200, 169, 81, 0.15)',
  },
  langChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  langChipTextActive: {
    color: COLORS.gold,
  },
  error: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
  },
});
