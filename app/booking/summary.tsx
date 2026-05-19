import { View, Text, StyleSheet } from 'react-native';

import { COLORS, TYPOGRAPHY } from '@/constants/tokens';

export default function BookingSummaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking — Summary</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
});
