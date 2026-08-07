import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthBrandMark } from '@/components/auth/AuthBrandMark';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AUTH_THEME } from '@/constants/authTheme';
import { TYPOGRAPHY } from '@/constants/tokens';

const FEATURE_KEYS = [
  'auth.featureStaffToday',
  'auth.featureStaffSchedule',
  'auth.featureStaffServices',
  'auth.featureStaffPerf',
] as const;

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <AuthScreenLayout
      heroTitle={t('auth.welcomeTitle')}
      heroSubtitle={t('auth.welcomeSubtitle')}
    >
      <AuthBrandMark />

      <Text style={styles.tagline}>{t('auth.welcomeStaffTagline')}</Text>

      <View style={styles.features}>
        {FEATURE_KEYS.map((key) => (
          <View key={key} style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>{t(key)}</Text>
          </View>
        ))}
      </View>

      <AuthPrimaryButton
        label={t('auth.signIn')}
        onPress={() => router.push('/(auth)/login' as Href)}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  tagline: {
    ...TYPOGRAPHY.body,
    color: AUTH_THEME.textSecondary,
    lineHeight: 22,
  },
  features: {
    gap: 10,
    marginVertical: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AUTH_THEME.primary,
  },
  featureText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: AUTH_THEME.textSecondary,
    flex: 1,
  },
});
