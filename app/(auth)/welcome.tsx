import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { signOut } from '@/lib/auth';
import { ownerColors } from '@/constants/ownerTheme';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account not linked</Text>
      <Text style={styles.body}>
        This app is for salon owners, managers, staff, and reception.{'\n\n'}
        Your account isn't linked to any salon. Contact your salon owner to be added to the team.
      </Text>
      <Pressable style={styles.btn} onPress={() => void handleSignOut()}>
        <Text style={styles.btnText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    backgroundColor: ownerColors.bg,
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: ownerColors.text,
  },
  body: {
    fontSize: 15,
    color: ownerColors.textMuted,
    lineHeight: 22,
  },
  btn: {
    borderWidth: 1,
    borderColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: ownerColors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
