import { useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { InviteStaffSheet, type InviteStaffValues } from "@/components/owner/InviteStaffSheet";
import { OwnerAddHeaderButton } from "@/components/owner/OwnerAddHeaderButton";
import { QueryState } from "@/components/owner/QueryState";
import { StaffDetailSheet, type StaffUpdateValues } from "@/components/owner/StaffDetailSheet";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useInviteStaff, useOwnerStaff, useUpdateStaffMember } from "@/hooks/useOwnerStaff";
import type { StaffMember } from "@/types/owner";

function StaffRow({ item, onPress }: { item: StaffMember; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.display_name}</Text>
        <View style={[styles.badge, !item.is_active && styles.badgeOff]}>
          <Text style={styles.badgeText}>{item.is_active ? "Actif" : "Inactif"}</Text>
        </View>
      </View>
      <Text style={styles.role}>{item.role}</Text>
      {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
    </Pressable>
  );
}

export default function OwnerStaffScreen() {
  const navigation = useNavigation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const { data, isLoading, isError, error, refetch, isRefetching } = useOwnerStaff(businessId);
  const invite = useInviteStaff(businessId);
  const updateMember = useUpdateStaffMember(businessId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<StaffMember | null>(null);

  const openInvite = useCallback(() => setInviteOpen(true), []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <OwnerAddHeaderButton onPress={openInvite} />,
    });
  }, [navigation, openInvite]);

  const staff = data ?? [];

  const onInvite = (values: InviteStaffValues) => {
    invite.mutate(values, {
      onSuccess: (res) => {
        setInviteOpen(false);
        Alert.alert("Invitation envoyée", `Un email a été envoyé à ${res.email}.`);
        void refetch();
      },
      onError: (e) => Alert.alert("Erreur", e.message),
    });
  };

  const onSaveStaff = (id: string, values: StaffUpdateValues) => {
    updateMember.mutate(
      { id, values },
      {
        onSuccess: () => {
          setDetailOpen(false);
          Alert.alert("Enregistré", "Membre mis à jour.");
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  return (
    <View style={styles.flex}>
      <QueryState
        loading={isLoading}
        error={isError ? (error as Error) : null}
        empty={!isLoading && staff.length === 0}
        emptyMessage="Aucun membre. Appuyez sur + pour inviter."
        onRetry={() => void refetch()}>
        <FlatList
          data={staff}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => (
            <StaffRow
              item={item}
              onPress={() => {
                setSelected(item);
                setDetailOpen(true);
              }}
            />
          )}
        />
      </QueryState>

      <InviteStaffSheet
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={onInvite}
        busy={invite.isPending}
      />

      <StaffDetailSheet
        member={selected}
        visible={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSave={onSaveStaff}
        busy={updateMember.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
  list: { padding: 16 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "600", color: ownerColors.text, flex: 1 },
  role: { fontSize: 14, color: ownerColors.primary, marginTop: 4, textTransform: "capitalize" },
  meta: { fontSize: 13, color: ownerColors.textMuted, marginTop: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
  },
  badgeOff: { backgroundColor: "#f5f5f5" },
  badgeText: { fontSize: 11, fontWeight: "600", color: ownerColors.textMuted },
});
