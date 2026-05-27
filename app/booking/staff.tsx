import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookingStepShell } from '@/components/booking/BookingStepShell';
import { StaffCard } from '@/components/booking/StaffCard';
import { useBookingActions } from '@/hooks/useBookingStore';
import { useStorefront } from '@/hooks/useStorefront';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/tokens';

export default function BookingStaffScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    salonSlug?: string;
    serviceId?: string;
    serviceName?: string;
    servicePrice?: string;
    serviceDuration?: string;
  }>();

  const salonSlug = params.salonSlug ?? '';
  const { data: storefront, isLoading, isError } = useStorefront(salonSlug);
  const { setSalon, setService, setStaff, reset } = useBookingActions();

  const service = useMemo(() => {
    if (!storefront || !params.serviceId) return null;
    return storefront.services.find((s) => s.id === params.serviceId) ?? null;
  }, [storefront, params.serviceId]);

  const team = useMemo(() => {
    if (!storefront || !params.serviceId) return [];
    return (storefront.team ?? []).filter((t) => t.serviceIds.includes(params.serviceId!));
  }, [storefront, params.serviceId]);

  const [pickedId, setPickedId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!storefront || !service) return;
    setSalon(
      salonSlug,
      storefront.businessId,
      storefront.name,
      storefront.contact.city,
      storefront.currencyCode,
    );
    setService(service.id, service.name, service.price, service.durationMin);
  }, [storefront, service, salonSlug, setSalon, setService]);

  const cancelBooking = () => {
    Alert.alert('Cancel booking?', 'Your selections will be cleared.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: () => {
          reset();
          router.back();
        },
      },
    ]);
  };

  const continueNext = () => {
    if (pickedId === undefined) return;
    const name =
      pickedId === null
        ? 'No Preference'
        : team.find((t) => t.id === pickedId)?.name ?? 'Stylist';
    setStaff(pickedId, pickedId === null ? null : name);
    router.push('/booking/datetime' as Href);
  };

  if (!salonSlug || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.orange} />
      </View>
    );
  }

  if (isError || !storefront || !service) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>Unable to load salon</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <BookingStepShell
      title="Choose Your Stylist"
      step={1}
      onBack={() => router.back()}
      rightAction={
        <Pressable onPress={cancelBooking} hitSlop={8}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      }
      continueDisabled={pickedId === undefined}
      onContinue={continueNext}>
      <Text style={styles.sub}>
        Select a team member for {service.name}
      </Text>
      <StaffCard
        staff={{ id: null, name: 'No Preference' }}
        selected={pickedId === null}
        onSelect={() => setPickedId(null)}
        noPreference
      />
      {team.map((member) => (
        <StaffCard
          key={member.id}
          staff={{
            id: member.id,
            name: member.name,
            role: member.role,
            avatarUrl: member.avatar,
          }}
          selected={pickedId === member.id}
          onSelect={() => setPickedId(member.id)}
        />
      ))}
    </BookingStepShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  err: { ...TYPOGRAPHY.body, color: COLORS.error },
  link: { ...TYPOGRAPHY.body, color: COLORS.orange, marginTop: SPACING.md },
  sub: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, marginBottom: SPACING.md },
  cancel: { ...TYPOGRAPHY.caption, color: COLORS.orange, fontWeight: '600' },
});
