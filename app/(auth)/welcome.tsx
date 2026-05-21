import { useRouter, type Href } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { ownerColors } from '@/constants/ownerTheme';
import { signOut } from '@/lib/auth';

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
        Your account isn't linked to a salon yet.{'\n\n'}
        Create your salon to get started, or ask your salon owner to add you as a team member.
      </Text>

      <Pressable
        style={styles.primaryBtn}
        onPress={() => router.push('/(auth)/create-business' as Href)}
      >
        <Text style={styles.primaryBtnText}>Create my salon</Text>
      </Pressable>

      <Pressable style={styles.outlineBtn} onPress={() => void handleSignOut()}>
        <Text style={styles.outlineBtnText}>Sign out</Text>
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
    gap: 16,
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
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineBtnText: { color: ownerColors.primary, fontSize: 15, fontWeight: '600' },
});
