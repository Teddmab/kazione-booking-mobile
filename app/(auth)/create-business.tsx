import { useQueryClient } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ownerColors } from '@/constants/ownerTheme';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';

type Step = 'form' | 'success';

export default function CreateBusinessScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('form');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const name = businessName.trim();
    if (!name) {
      setError('Please enter your salon name.');
      return;
    }
    if (name.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await api.post('/create-business', { business_name: name });
      await queryClient.invalidateQueries({ queryKey: ['tenant', user?.id] });
      setStep('success');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not create your salon. Check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>Your salon is ready</Text>
        <Text style={styles.successBody}>
          <Text style={styles.boldName}>{businessName.trim()}</Text> has been created.
          {'\n'}You can now manage your team, services, and appointments.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.replace('/' as Href)}
        >
          <Text style={styles.primaryBtnText}>Go to dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>New salon</Text>
        <Text style={styles.title}>Tell us about your salon</Text>
        <Text style={styles.body}>
          Enter your salon's name. You can update it anytime from settings.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Salon name</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="e.g. Afrotouch Salon"
            placeholderTextColor={ownerColors.textDim}
            value={businessName}
            onChangeText={(t) => {
              setBusinessName(t);
              if (error) setError(null);
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <Pressable
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={() => void submit()}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Creating…' : 'Create salon'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  container: {
    flexGrow: 1,
    padding: 28,
    paddingTop: 48,
    gap: 16,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: ownerColors.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: ownerColors.text,
    lineHeight: 32,
  },
  body: {
    fontSize: 15,
    color: ownerColors.textMuted,
    lineHeight: 22,
    marginBottom: 8,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: ownerColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: ownerColors.text,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: ownerColors.danger },
  errorText: { fontSize: 13, color: ownerColors.danger, marginTop: 2 },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: ownerColors.textMuted, fontSize: 15 },
  // success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    backgroundColor: ownerColors.bg,
    gap: 16,
  },
  successIcon: {
    fontSize: 48,
    color: ownerColors.primary,
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: ownerColors.text,
  },
  successBody: {
    fontSize: 15,
    color: ownerColors.textMuted,
    lineHeight: 22,
  },
  boldName: { fontWeight: '700', color: ownerColors.text },
});
