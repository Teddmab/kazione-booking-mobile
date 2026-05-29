import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthBrandMark } from '@/components/auth/AuthBrandMark';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { AUTH_THEME } from '@/constants/authTheme';
import { TYPOGRAPHY } from '@/constants/tokens';
import { resetPassword } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
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
    <AuthScreenLayout showHero={false}>
      <AuthBrandMark />

      <View style={styles.heading}>
        <Text style={styles.title}>{t('auth.resetTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.resetSubtitle')}</Text>
      </View>

      <AuthTextField
        label={t('auth.email')}
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {success ? <Text style={styles.success}>{t('auth.resetSuccess')}</Text> : null}

      <AuthPrimaryButton
        label={t('auth.sendResetLink')}
        onPress={() => void submit()}
        loading={loading}
      />

      <Link href={'/(auth)/login' as Href}>
        <Text style={styles.backLink}>{t('auth.backToSignIn')}</Text>
      </Link>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 4 },
  title: {
    ...TYPOGRAPHY.display,
    fontSize: 28,
    color: AUTH_THEME.text,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: AUTH_THEME.textSecondary,
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: AUTH_THEME.errorBg,
    borderWidth: 1,
    borderColor: AUTH_THEME.errorBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: AUTH_THEME.error,
  },
  success: {
    ...TYPOGRAPHY.body,
    color: '#2E7D4F',
  },
  backLink: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: AUTH_THEME.primary,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
