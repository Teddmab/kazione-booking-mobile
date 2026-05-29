import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AUTH_THEME } from '@/constants/authTheme';
import { TYPOGRAPHY } from '@/constants/tokens';

export type AuthLoginTab = 'business' | 'customer';

interface AuthTabSwitcherProps {
  tab: AuthLoginTab;
  onChange: (tab: AuthLoginTab) => void;
  businessLabel: string;
  customerLabel: string;
}

export function AuthTabSwitcher({
  tab,
  onChange,
  businessLabel,
  customerLabel,
}: AuthTabSwitcherProps) {
  return (
    <View style={styles.track}>
      {(['business', 'customer'] as const).map((t) => {
        const active = tab === t;
        return (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(t)}
          >
            <Ionicons
              name={t === 'business' ? 'business-outline' : 'person-outline'}
              size={16}
              color={active ? AUTH_THEME.text : AUTH_THEME.textMuted}
            />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {t === 'business' ? businessLabel : customerLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: AUTH_THEME.mutedTrack,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: AUTH_THEME.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: AUTH_THEME.border,
  },
  tabText: {
    ...TYPOGRAPHY.label,
    fontWeight: '500',
    color: AUTH_THEME.textMuted,
  },
  tabTextActive: {
    color: AUTH_THEME.text,
    fontWeight: '600',
  },
});
