import { Ionicons } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { AUTH_THEME } from '@/constants/authTheme';
import { TYPOGRAPHY } from '@/constants/tokens';
import { useAuthLogin } from '@/hooks/useAuthLogin';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { submit, loading, error } = useAuthLogin();

  return (
    <AuthScreenLayout
      heroTitle={t('auth.heroTitle')}
      heroSubtitle={t('auth.heroSubtitle')}
    >
      <View style={styles.formBody}>
        <View style={styles.badge}>
        <Text style={styles.badgeText}>{t('auth.businessPortal')}</Text>
      </View>

      <View style={styles.heading}>
        <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
        <Text style={styles.subtitle}>{t('auth.signInOwnerSubtitle')}</Text>
      </View>

      <Text style={styles.hint}>{t('auth.tabHintBusiness')}</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <AuthTextField
        label={t('auth.email')}
        placeholder="owner@salon.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
      />

      <AuthTextField
        label={t('auth.password')}
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="password"
        labelRight={
          <Link href={'/(auth)/forgot-password' as Href} asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.forgotLink}>{t('auth.forgotPassword')}</Text>
            </Pressable>
          </Link>
        }
        rightAccessory={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={8}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={AUTH_THEME.textMuted}
            />
          </Pressable>
        }
      />
      </View>

      <View style={styles.ctaBlock}>
        <AuthPrimaryButton
          label={loading ? t('auth.signingIn') : t('auth.signIn')}
          onPress={() => void submit(email, password)}
          loading={loading}
        />

        <Text style={styles.signupFooter}>
          {t('auth.newToKazione')}{' '}
          <Link href={'/(auth)/signup' as Href} asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.signupLink}>{t('auth.createBusinessAccount')}</Text>
            </Pressable>
          </Link>
        </Text>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  formBody: {
    width: '100%',
    gap: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: AUTH_THEME.mutedTrack,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '600',
    color: AUTH_THEME.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heading: {
    gap: 4,
  },
  title: {
    ...TYPOGRAPHY.display,
    fontSize: 28,
    color: AUTH_THEME.text,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: AUTH_THEME.textSecondary,
  },
  hint: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: AUTH_THEME.textMuted,
    marginTop: -8,
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
    fontSize: 13,
    color: AUTH_THEME.error,
  },
  forgotLink: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: AUTH_THEME.textMuted,
  },
  ctaBlock: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 8,
    gap: 16,
    maxWidth: 400,
  },
  signupFooter: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: AUTH_THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  signupLink: {
    color: AUTH_THEME.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
