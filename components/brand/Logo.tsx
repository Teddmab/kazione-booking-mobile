import { Image, StyleSheet, View } from 'react-native';

import { Logos } from '@/constants/logos';

type LogoSize = 'sm' | 'md' | 'lg';
type LogoVariant = 'full' | 'icon-only';

const sizeMap: Record<LogoSize, { icon: number; fullW: number; fullH: number }> = {
  sm: { icon: 28, fullW: 100, fullH: 33 },
  md: { icon: 40, fullW: 120, fullH: 40 },
  lg: { icon: 56, fullW: 140, fullH: 46 },
};

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  /** Use white wordmark on dark backgrounds */
  onDark?: boolean;
}

export function Logo({ size = 'md', variant = 'full', onDark = false }: LogoProps) {
  const dims = sizeMap[size];

  if (variant === 'icon-only') {
    return (
      <Image
        source={Logos.iconOrange}
        style={{ width: dims.icon, height: dims.icon }}
        resizeMode="contain"
        accessibilityLabel="KaziOne"
      />
    );
  }

  return (
    <View style={styles.row}>
      <Image
        source={onDark ? Logos.whiteFull : Logos.blackFull}
        style={{ width: dims.fullW, height: dims.fullH }}
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
});
