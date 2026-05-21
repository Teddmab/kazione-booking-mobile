import { View, Text, StyleSheet } from 'react-native';

import { ownerColors } from '@/constants/ownerTheme';

export default function OwnerReportsScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>📄</Text>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.sub}>Transaction history and CSV export coming in Sprint M5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ownerColors.bg, gap: 8 },
  emoji: { fontSize: 40 },
  title: { fontSize: 20, fontWeight: '700', color: ownerColors.text },
  sub: { fontSize: 14, color: ownerColors.textMuted },
});
