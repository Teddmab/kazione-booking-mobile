import { Image, StyleSheet, Text, View } from 'react-native';

import { COLORS, TYPOGRAPHY } from '@/constants/tokens';

type LogoSize = 'sm' | 'md' | 'lg';
type LogoVariant = 'full' | 'icon-only';

const sizeMap: Record<LogoSize, number> = {
  sm: 28,
  md: 40,
  lg: 56,
};

interface LogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
}

export function Logo({ size = 'md', variant = 'full' }: LogoProps) {
  const dimension = sizeMap[size];

  return (
    <View style={styles.row}>
      <Image
        source={require('@/assets/images/icon.png')}
        style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
        resizeMode="cover"
      />
      {variant === 'full' ? (
        <Text style={[styles.wordmark, size === 'lg' && styles.wordmarkLg]}>KaziOne</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    ...TYPOGRAPHY.h2,
    color: COLORS.gold,
  },
  wordmarkLg: {
    ...TYPOGRAPHY.display,
    color: COLORS.gold,
  },
});
