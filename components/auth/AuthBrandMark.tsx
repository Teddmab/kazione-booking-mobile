import { Image, StyleSheet, View } from 'react-native';

import { Logos } from '@/constants/logos';

interface AuthBrandMarkProps {
  variant?: 'light' | 'dark';
}

export function AuthBrandMark({ variant = 'light' }: AuthBrandMarkProps) {
  const isDark = variant === 'dark';
  return (
    <View style={styles.row} accessibilityRole="header">
      <Image
        source={isDark ? Logos.whiteFull : Logos.blackFull}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="KaziOne"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 46,
  },
});
