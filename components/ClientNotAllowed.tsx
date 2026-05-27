import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ownerColors } from '@/constants/ownerTheme';

interface ClientNotAllowedProps {
  onSignOut: () => void;
}

export function ClientNotAllowed({ onSignOut }: ClientNotAllowedProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{t('auth.clientNotAllowedTitle')}</Text>
      <Text style={styles.body}>{t('auth.clientNotAllowedBody')}</Text>
      <Pressable style={styles.btn} onPress={onSignOut}>
        <Text style={styles.btnText}>{t('auth.backToSignIn')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: ownerColors.bg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: ownerColors.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: ownerColors.textMuted,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
