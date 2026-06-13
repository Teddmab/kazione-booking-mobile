import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { QueryState } from "@/components/owner/QueryState";
import { StaffDetailSheet, type StaffUpdateValues } from "@/components/owner/StaffDetailSheet";
import { StaffScheduleSheet } from "@/components/owner/StaffScheduleSheet";
import { StaffServicesSheet } from "@/components/owner/StaffServicesSheet";
import { ownerColors } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useOwnerServices } from "@/hooks/useOwnerServices";
import {
  useAssignStaffServices,
  useInviteStaff,
  useOwnerStaff,
  useResendStaffInvite,
  useStaffSchedule,
  useStaffServices,
  useUpdateStaffMember,
} from "@/hooks/useOwnerStaff";
import type { StaffMember, StaffWorkingDay } from "@/types/owner";

function StaffRow({ item, onPress }: { item: StaffMember; onPress: () => void }) {
  const pending = item.is_pending_invite;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.display_name}</Text>
        <View style={[styles.badge, pending ? styles.badgePending : !item.is_active && styles.badgeOff]}>
          <Text style={styles.badgeText}>
            {pending ? "Invitation" : item.is_active ? "Actif" : "Inactif"}
          </Text>
        </View>
      </View>
      <Text style={styles.role}>{item.role}</Text>
      {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
      {item.appointments_last_30_days != null ? (
        <Text style={styles.meta}>{item.appointments_last_30_days} RDV (30 j)</Text>
      ) : null}
    </Pressable>
  );
}

interface Props {
  variant: "tab" | "stack";
}

export function OwnerStaffScreenContent({ variant }: Props) {
  const { t } = useTranslation();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";

  const { data, isLoading, isError, error, refetch, isRefetching } = useOwnerStaff(businessId);
  const { data: services = [] } = useOwnerServices(businessId);
  const invite = useInviteStaff(businessId);
  const updateMember = useUpdateStaffMember(businessId);
  const saveSchedule = useStaffSchedule(businessId);
  const assignServices = useAssignStaffServices(businessId);
  const resendInvite = useResendStaffInvite(businessId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [selected, setSelected] = useState<StaffMember | null>(null);

  const servicesQuery = useStaffServices(servicesOpen ? selected?.id ?? null : null);
  const openInvite = useCallback(() => setInviteOpen(true), []);
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

  const onSaveSchedule = (schedule: StaffWorkingDay[]) => {
    if (!selected) return;
    saveSchedule.mutate(
      { staffId: selected.id, schedule },
      {
        onSuccess: () => {
          setScheduleOpen(false);
          Alert.alert("Enregistré", "Horaires mis à jour.");
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onSaveServices = (serviceIds: string[]) => {
    if (!selected) return;
    assignServices.mutate(
      { staffId: selected.id, serviceIds },
      {
        onSuccess: () => {
          setServicesOpen(false);
          Alert.alert("Enregistré", "Services assignés.");
        },
        onError: (e) => Alert.alert("Erreur", e.message),
      },
    );
  };

  const onResendInvite = () => {
    if (!selected) return;
    resendInvite.mutate(selected.id, {
      onSuccess: (res) => {
        Alert.alert(
          res.invite_sent ? "Invitation renvoyée" : "Échec envoi",
          res.invite_sent ? `Email envoyé à ${res.email}` : res.email_error ?? "Erreur email",
        );
      },
      onError: (e) => Alert.alert("Erreur", e.message),
    });
  };

  const body = (
    <>
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
        onEditSchedule={() => {
          setDetailOpen(false);
          setScheduleOpen(true);
        }}
        onEditServices={() => {
          setDetailOpen(false);
          setServicesOpen(true);
        }}
        onResendInvite={selected?.is_pending_invite ? onResendInvite : undefined}
        busy={updateMember.isPending}
        resendBusy={resendInvite.isPending}
      />

      <StaffScheduleSheet
        member={selected}
        visible={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSave={onSaveSchedule}
        busy={saveSchedule.isPending}
      />

      <StaffServicesSheet
        member={selected}
        visible={servicesOpen}
        services={services}
        assignedIds={servicesQuery.data?.service_ids ?? []}
        loading={servicesQuery.isLoading}
        onClose={() => setServicesOpen(false)}
        onSave={onSaveServices}
        busy={assignServices.isPending}
      />
    </>
  );

  if (variant === "tab") {
    return (
      <View style={styles.flex}>
        <OwnerAppBar
          title={t("owner.staff")}
          rightSlot={<OwnerAddHeaderButton onPress={openInvite} />}
        />
        {body}
      </View>
    );
  }

  return (
    <OwnerStackShell
      title={t("owner.staff")}
      rightSlot={<OwnerAddHeaderButton onPress={openInvite} />}>
      {body}
    </OwnerStackShell>
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
  badgePending: { backgroundColor: "#fff3e0" },
  badgeOff: { backgroundColor: "#f5f5f5" },
  badgeText: { fontSize: 11, fontWeight: "600", color: ownerColors.textMuted },
});
