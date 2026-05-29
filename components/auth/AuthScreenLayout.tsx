import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBrandMark } from '@/components/auth/AuthBrandMark';
import { AUTH_THEME } from '@/constants/authTheme';
import { TYPOGRAPHY } from '@/constants/tokens';

const SALON_COVER = require('../../assets/images/onboarding/salon-afrotouch-cover.jpg');

interface AuthScreenLayoutProps {
  children: React.ReactNode;
  heroTitle?: string;
  heroSubtitle?: string;
  showHero?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AuthScreenLayout({
  children,
  heroTitle,
  heroSubtitle,
  showHero = true,
  contentStyle,
}: AuthScreenLayoutProps) {
  const formTopPadding = showHero ? 28 : 20;

  return (
    <SafeAreaView style={styles.flex} edges={showHero ? ['bottom'] : ['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          bounces
        >
          {showHero ? (
            <ImageBackground source={SALON_COVER} style={styles.hero} resizeMode="cover">
              <View style={styles.heroOverlay} />
              <SafeAreaView edges={['top']} style={styles.heroInner}>
                <AuthBrandMark variant="dark" />
                {heroTitle ? <Text style={styles.heroTitle}>{heroTitle}</Text> : null}
                {heroSubtitle ? <Text style={styles.heroSubtitle}>{heroSubtitle}</Text> : null}
              </SafeAreaView>
            </ImageBackground>
          ) : null}

          <View style={[styles.form, { paddingTop: formTopPadding }, contentStyle]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AUTH_THEME.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  hero: {
    minHeight: 168,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AUTH_THEME.heroOverlay,
  },
  heroInner: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  heroTitle: {
    ...TYPOGRAPHY.h1,
    color: '#FFFFFF',
    marginTop: 16,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    maxWidth: 300,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 20,
    width: '100%',
  },
});
