import { useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { BookingStepShell } from '@/components/booking/BookingStepShell';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useBookingActions, useBookingDraft } from '@/hooks/useBookingStore';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, session } = useAuth();
  const draft = useBookingDraft();
  const { setClientDetails, setGdprConsent } = useBookingActions();

  const [name, setName] = useState(draft.clientName);
  const [email, setEmail] = useState(draft.clientEmail);
  const [phone, setPhone] = useState(draft.clientPhone);
  const [gdpr, setGdpr] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false });

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata as { full_name?: string };
    if (!name && meta.full_name) setName(meta.full_name);
    if (!email && user.email) setEmail(user.email);
  }, [user, email, name]);

  const nameError = touched.name && name.trim().length < 2 ? 'Name is required' : undefined;
  const emailError =
    touched.email && !EMAIL_RE.test(email.trim()) ? 'Valid email required' : undefined;

  const canContinue = useMemo(
    () =>
      name.trim().length >= 2 &&
      EMAIL_RE.test(email.trim()) &&
      phone.trim().length >= 6 &&
      gdpr,
    [name, email, phone, gdpr],
  );

  const continueNext = () => {
    setClientDetails(name.trim(), email.trim(), phone.trim());
    setGdprConsent(true);
    router.push('/booking/summary' as Href);
  };

  return (
    <BookingStepShell
      title="Your Details"
      step={3}
      onBack={() => router.back()}
      continueDisabled={!canContinue}
      onContinue={continueNext}>
      <Text style={styles.sub}>
        {t('booking.detailsLead', 'How can we reach you for this appointment?')}
      </Text>

      {!session ? (
        <View style={styles.bannerMuted}>
          <Text style={styles.bannerText}>
            {t('booking.signInHint', 'Already have an account? Sign in to pre-fill your details')}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/login-client' as Href)}>
            <Text style={styles.bannerLink}>{t('auth.signIn', 'Sign in')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.bannerOk}>
          <Text style={styles.bannerOkText}>
            {t('booking.signedInAs', 'Signed in as')} {user?.email}
          </Text>
        </View>
      )}

      <Input
        label={t('auth.name', 'Full name')}
        placeholder="Jane Doe"
        value={name}
        onChangeText={setName}
        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
        error={nameError}
      />
      <Input
        label={t('auth.email', 'Email')}
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        error={emailError}
      />
      <Input
        label={t('booking.phone', 'Phone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+372…"
      />

      <Pressable
        style={styles.gdprRow}
        onPress={() => setGdpr((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: gdpr }}>
        <View style={[styles.checkbox, gdpr && styles.checkboxOn]}>
          {gdpr ? <Ionicons name="checkmark" size={14} color={COLORS.background} /> : null}
        </View>
        <Text style={styles.gdprText}>
          {t('booking.gdprConsent')}{' '}
          <Text
            style={styles.privacyLink}
            onPress={() => void WebBrowser.openBrowserAsync('https://kazione.app/legal/privacy')}>
            Privacy Policy
          </Text>
        </Text>
      </Pressable>
    </BookingStepShell>
  );
}

const styles = StyleSheet.create({
  sub: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.md },
  bannerMuted: {
    backgroundColor: COLORS.elevated,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  bannerText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  bannerLink: { ...TYPOGRAPHY.caption, color: COLORS.orange, marginTop: 4, fontWeight: '600' },
  bannerOk: {
    backgroundColor: '#1a2e1f',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  bannerOkText: { ...TYPOGRAPHY.caption, color: '#6fcf97' },
  gdprRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginTop: SPACING.md },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: COLORS.orange },
  gdprText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, flex: 1 },
  privacyLink: { color: COLORS.orange, textDecorationLine: 'underline' },
});
