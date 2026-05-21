import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ownerColors, ownerStyles } from '@/constants/ownerTheme';
import { useAuthContext } from '@/contexts/AuthContext';

type NavSection = {
  title: string;
  items: { key: string; label: string; subtitle: string; href: string; icon: string }[];
};

const SECTIONS: NavSection[] = [
  {
    title: 'Management',
    items: [
      { key: 'clients', label: 'Clients', subtitle: 'Client roster and history', href: '/(app)/owner/clients', icon: 'person-outline' },
      { key: 'services', label: 'Services', subtitle: 'Pricing and durations', href: '/(app)/owner/services', icon: 'cut-outline' },
      { key: 'storefront', label: 'Storefront', subtitle: 'Public profile and gallery', href: '/(app)/owner/storefront', icon: 'storefront-outline' },
    ],
  },
  {
    title: 'Finance & Reports',
    items: [
      { key: 'finance', label: 'Revenue', subtitle: 'Daily, weekly, monthly totals', href: '/(app)/owner/finance', icon: 'bar-chart-outline' },
      { key: 'reports', label: 'Reports', subtitle: 'Transactions and exports', href: '/(app)/owner/reports', icon: 'document-text-outline' },
    ],
  },
  {
    title: 'Account',
    items: [
      { key: 'settings', label: 'Settings', subtitle: 'Business info and preferences', href: '/(app)/owner/settings', icon: 'settings-outline' },
    ],
  },
];

export default function OwnerMoreScreen() {
  const router = useRouter();
  const { signOut } = useAuthContext();

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      {SECTIONS.map((section) => (
        <View key={section.title}>
          <Text style={ownerStyles.sectionTitle}>{section.title}</Text>
          <View style={styles.group}>
            {section.items.map((item, idx) => (
              <Pressable
                key={item.key}
                style={[
                  styles.row,
                  idx < section.items.length - 1 && styles.rowBorder,
                ]}
                onPress={() => router.push(item.href as Href)}
              >
                <Ionicons name={item.icon as never} size={20} color={ownerColors.primary} style={styles.icon} />
                <View style={styles.rowText}>
                  <Text style={ownerStyles.rowTitle}>{item.label}</Text>
                  <Text style={ownerStyles.rowSub}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={ownerColors.textDim} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={18} color={ownerColors.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  scroll: { padding: 20, paddingBottom: 48 },
  group: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: ownerColors.border,
  },
  icon: { marginRight: 12 },
  rowText: { flex: 1 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: ownerColors.danger,
  },
});
