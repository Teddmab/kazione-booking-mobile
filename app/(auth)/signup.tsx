import { useQueryClient } from '@tanstack/react-query';
import { Link, useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthPickerField } from '@/components/auth/AuthPickerField';
import { AuthBrandMark } from '@/components/auth/AuthBrandMark';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { SignupStepIndicator } from '@/components/auth/SignupStepIndicator';
import {
  BUSINESS_TYPES,
  SIGNUP_COUNTRIES,
  type BusinessTypeValue,
  type SignupCountryValue,
} from '@/constants/authSignup';
import { AUTH_THEME } from '@/constants/authTheme';
import { TYPOGRAPHY } from '@/constants/tokens';
import { tenantQueryKey } from '@/contexts/TenantContext';
import { ApiError } from '@/lib/api';
import { registerBusinessOwner, signInWithEmail } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export default function SignupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessTypeValue>('hair_salon');
  const [country, setCountry] = useState<SignupCountryValue>('FR');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const businessTypeOptions = useMemo(
    () => BUSINESS_TYPES.map((item) => ({ value: item.value, label: t(item.labelKey) })),
    [t],
  );

  const countryOptions = useMemo(
    () => SIGNUP_COUNTRIES.map((item) => ({ value: item.value, label: t(item.labelKey) })),
    [t],
  );

  const goToStep2 = () => {
    setError(null);
    if (!fullName.trim()) {
      setError(t('auth.errorNameRequired'));
      return;
    }
    if (!email.trim()) {
      setError(t('auth.errorEmailRequired'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.errorPasswordMin'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.errorPasswordMismatch'));
      return;
    }
    setStep(2);
  };

  const submitOwnerAccount = async () => {
    setError(null);
    if (!businessName.trim()) {
      setError(t('auth.errorBusinessNameRequired'));
      return;
    }

    setLoading(true);
    try {
      await registerBusinessOwner({
        email: email.trim(),
        password,
        ownerName: fullName.trim(),
        businessName: businessName.trim(),
      });

      const { error: signErr } = await signInWithEmail(email.trim(), password);
      if (signErr) {
        setError(signErr.message);
        return;
      }

      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await queryClient.invalidateQueries({ queryKey: tenantQueryKey(userId) });
      }

      router.replace('/' as Href);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_TAKEN') {
        setError(t('auth.emailInUse'));
        setStep(1);
        return;
      }
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout showHero={false}>
      <View style={styles.formBody}>
        <AuthBrandMark />

        <SignupStepIndicator step={step} label={t('auth.signupStepOf', { step })} />

        <View style={styles.heading}>
          <Text style={styles.title}>
            {step === 1 ? t('auth.signupTitle') : t('auth.signupBusinessTitle')}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 ? t('auth.signupOwnerSubtitle') : t('auth.signupBusinessSubtitle')}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {step === 1 ? (
          <>
            <AuthTextField
              label={t('auth.name')}
              placeholder={t('auth.namePlaceholder')}
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
            />
            <AuthTextField
              label={t('auth.email')}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />
            <AuthTextField
              label={t('auth.password')}
              placeholder={t('auth.passwordMin8')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
            <AuthTextField
              label={t('auth.confirmPassword')}
              placeholder={t('auth.passwordMin8')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="password"
            />

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.backBtn}
                onPress={() => router.back()}
                accessibilityRole="button">
                <Text style={styles.backBtnText}>{t('common.back')}</Text>
              </Pressable>
              <View style={styles.primaryAction}>
                <AuthPrimaryButton label={t('common.next')} onPress={goToStep2} />
              </View>
            </View>
          </>
        ) : (
          <>
            <AuthTextField
              label={t('auth.businessName')}
              placeholder={t('auth.businessNamePlaceholder')}
              value={businessName}
              onChangeText={setBusinessName}
              autoComplete="name"
            />
            <AuthPickerField
              label={t('auth.fieldBusinessType')}
              value={businessType}
              options={businessTypeOptions}
              onChange={(v) => setBusinessType(v as BusinessTypeValue)}
            />
            <AuthPickerField
              label={t('auth.fieldCountry')}
              value={country}
              options={countryOptions}
              onChange={(v) => setCountry(v as SignupCountryValue)}
            />

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.backBtn}
                onPress={() => {
                  setError(null);
                  setStep(1);
                }}
                accessibilityRole="button">
                <Text style={styles.backBtnText}>{t('common.back')}</Text>
              </Pressable>
              <View style={styles.primaryAction}>
                <AuthPrimaryButton
                  label={loading ? t('auth.creatingAccount') : t('auth.createAccount')}
                  onPress={() => void submitOwnerAccount()}
                  loading={loading}
                />
              </View>
            </View>
          </>
        )}

        <Text style={styles.footer}>
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href={'/(auth)/login' as Href} asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
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
    maxWidth: 400,
    alignSelf: 'center',
    gap: 20,
  },
  heading: { gap: 4, width: '100%' },
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
  errorBox: {
    backgroundColor: AUTH_THEME.errorBg,
    borderWidth: 1,
    borderColor: AUTH_THEME.errorBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: AUTH_THEME.error,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  backBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AUTH_THEME.border,
    backgroundColor: AUTH_THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  backBtnText: {
    ...TYPOGRAPHY.label,
    fontSize: 15,
    color: AUTH_THEME.text,
    fontWeight: '600',
  },
  primaryAction: {
    flex: 1,
  },
  footer: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: AUTH_THEME.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  footerLink: {
    color: AUTH_THEME.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
