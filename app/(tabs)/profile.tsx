import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const { language, setLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.title')}</Text>
      {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      <Text style={styles.label}>{t('profile.language')}: {language.toUpperCase()}</Text>
      <View style={styles.langRow}>
        {(['en', 'fr', 'et'] as const).map((lang) => (
          <Button
            key={lang}
            variant={language === lang ? 'primary' : 'ghost'}
            size="sm"
            label={lang.toUpperCase()}
            onPress={() => void setLanguage(lang)}
          />
        ))}
      </View>
      <Text style={styles.loadingDemo}>{t('common.loading')}</Text>
      <Button variant="danger" label={t('profile.signOut')} onPress={() => void signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    gap: SPACING.md,
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  email: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
  },
  langRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  loadingDemo: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
});
