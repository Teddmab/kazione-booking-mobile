import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import {
  ServiceDetailSheet,
  shareReferralUrl,
} from "@/components/staff/ServiceDetailSheet";
import { ownerColors, ownerFonts, ownerStyles } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useRespondToServiceOffer,
  useStaffServices,
} from "@/hooks/useStaffServices";
import { useStaffSelf } from "@/hooks/useStaffSelf";
import {
  commissionEarnings,
  commissionLabel,
} from "@/lib/commissionLabel";
import { formatCurrency } from "@/lib/format";
import {
  buildStaffReferralLink,
  useStaffReferralLink,
} from "@/lib/referralLink";
import type { StaffService } from "@/services/staff/services";

function OfferCard({
  service,
  busy,
  onAccept,
  onDecline,
}: {
  service: StaffService;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const currency = service.currency_code || "EUR";
  const price = service.effective_price ?? service.price;
  const type =
    service.offered_commission_type ?? service.staff_commission_type ?? null;
  const value =
    service.offered_commission_value ?? service.staff_commission_value ?? null;

  return (
    <View style={styles.offerCard}>
      <Text style={styles.svcName}>{service.name}</Text>
      <Text style={styles.svcMeta}>
        {service.duration_minutes} min · {formatCurrency(price, currency)}
      </Text>
      <Text style={styles.commHint}>{commissionLabel(type, value, currency)}</Text>
      <View style={styles.offerActions}>
        <Pressable
          style={[styles.acceptBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={onAccept}>
          <Text style={styles.acceptText}>Accepter</Text>
        </Pressable>
        <Pressable
          style={[styles.declineBtn, busy && styles.disabled]}
          disabled={busy}
          onPress={onDecline}>
          <Text style={styles.declineText}>Refuser</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ServiceRow({
  service,
  onPress,
  onShare,
}: {
  service: StaffService;
  onPress: () => void;
  onShare: () => void;
}) {
  const currency = service.currency_code || "EUR";
  const price = service.effective_price ?? service.price;
  const type =
    service.offered_commission_type ?? service.staff_commission_type ?? null;
  const value =
    service.offered_commission_value ?? service.staff_commission_value ?? null;

  return (
    <View style={styles.svcCard}>
      <Pressable style={{ flex: 1 }} onPress={onPress}>
        <Text style={styles.svcName}>{service.name}</Text>
        <Text style={styles.svcMeta}>
          {service.category_name ?? "Autre"} · {service.duration_minutes} min ·{" "}
          {formatCurrency(price, currency)}
        </Text>
        <Text style={styles.commHint}>{commissionLabel(type, value, currency)}</Text>
      </Pressable>
      <Pressable style={styles.shareChip} onPress={onShare}>
        <Text style={styles.shareChipText}>Partager</Text>
      </Pressable>
    </View>
  );
}

export default function StaffServicesScreen() {
  const toast = useToast();
  const { tenant } = useTenantContext();
  const { data: self } = useStaffSelf();
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useStaffServices();
  const respond = useRespondToServiceOffer();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");
  const [selected, setSelected] = useState<StaffService | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const selectedLink = useStaffReferralLink(selected?.id);

  const services = data ?? [];
  const pending = useMemo(
    () => services.filter((s) => s.assignment_status === "pending"),
    [services],
  );
  const accepted = useMemo(
    () => services.filter((s) => s.assignment_status === "accepted"),
    [services],
  );

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(accepted.map((s) => s.category_name ?? "Autre")),
    ).sort();
    return ["Tous", ...cats];
  }, [accepted]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accepted.filter((s) => {
      const matchCat =
        category === "Tous" || (s.category_name ?? "Autre") === category;
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [accepted, category, search]);

  const avgCommission = useMemo(() => {
    const earnings = accepted
      .map((svc) => {
        const type =
          svc.offered_commission_type ?? svc.staff_commission_type ?? null;
        const value =
          svc.offered_commission_value ?? svc.staff_commission_value ?? null;
        return commissionEarnings(type, value, svc.effective_price ?? svc.price);
      })
      .filter((v): v is number => v !== null);
    return earnings.length > 0
      ? earnings.reduce((s, v) => s + v, 0) / earnings.length
      : 0;
  }, [accepted]);

  const avgDuration = useMemo(() => {
    if (accepted.length === 0) return 0;
    return Math.round(
      accepted.reduce((s, svc) => s + svc.duration_minutes, 0) / accepted.length,
    );
  }, [accepted]);

  const currency = accepted[0]?.currency_code || "EUR";

  function referralUrl(serviceId?: string): string | null {
    const slug = tenant?.slug;
    const staffProfileId =
      self?.staff_profile_id ?? tenant?.staffProfileId ?? null;
    if (!slug || !staffProfileId) return null;
    return buildStaffReferralLink(slug, staffProfileId, serviceId);
  }

  function handleRespond(svc: StaffService, response: "accepted" | "declined") {
    setRespondingId(svc.id);
    respond.mutate(
      { serviceId: svc.id, response },
      {
        onSuccess: () => {
          toast.success(
            "Offre",
            response === "accepted"
              ? `${svc.name} accepté.`
              : `${svc.name} refusé.`,
          );
        },
        onError: (err: Error) => {
          toast.error("Erreur", err.message || "Impossible de répondre à l'offre");
        },
        onSettled: () => setRespondingId(null),
      },
    );
  }

  async function shareFor(serviceId?: string) {
    const url = referralUrl(serviceId);
    if (!url) {
      toast.warning("Partage", "Lien de parrainage indisponible.");
      return;
    }
    try {
      await shareReferralUrl(url);
    } catch (err) {
      toast.error(
        "Partage",
        err instanceof Error ? err.message : "Partage impossible",
      );
    }
  }

  return (
    <View style={ownerStyles.screen}>
      <StaffAppBar
        title="Services"
        subtitle={
          self
            ? `${accepted.length} prestation${accepted.length === 1 ? "" : "s"}`
            : undefined
        }
        displayTitle
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={ownerColors.primary}
          />
        }>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{accepted.length}</Text>
            <Text style={styles.statLabel}>Acceptés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {accepted.length > 0 ? formatCurrency(avgCommission, currency) : "—"}
            </Text>
            <Text style={styles.statLabel}>Comm. moy.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {accepted.length > 0 ? `${avgDuration} min` : "—"}
            </Text>
            <Text style={styles.statLabel}>Durée moy.</Text>
          </View>
        </View>

        <QueryState
          loading={isLoading}
          error={isError ? (error as Error) : null}
          empty={!isLoading && services.length === 0}
          emptyMessage="Aucune prestation assignée pour le moment."
          onRetry={() => void refetch()}>
          {pending.length > 0 ? (
            <View style={styles.offersSection}>
              <Text style={styles.offersTitle}>
                Offres de services ({pending.length})
              </Text>
              {pending.map((svc) => (
                <OfferCard
                  key={svc.id}
                  service={svc}
                  busy={respondingId === svc.id || respond.isPending}
                  onAccept={() => handleRespond(svc, "accepted")}
                  onDecline={() => handleRespond(svc, "declined")}
                />
              ))}
            </View>
          ) : null}

          <Text style={ownerStyles.sectionTitle}>Mes services</Text>
          <TextInput
            style={styles.search}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un service…"
            placeholderTextColor={ownerColors.textDim}
            autoCapitalize="none"
          />
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            {categories.map((cat) => {
              const active = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(cat)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filtered.length === 0 ? (
            <Text style={styles.emptyFiltered}>Aucun service dans cette vue.</Text>
          ) : (
            filtered.map((svc) => (
              <ServiceRow
                key={svc.id}
                service={svc}
                onPress={() => setSelected(svc)}
                onShare={() => void shareFor(svc.id)}
              />
            ))
          )}
        </QueryState>
      </ScrollView>

      <ServiceDetailSheet
        service={selected}
        visible={!!selected}
        referralLink={selectedLink}
        onClose={() => setSelected(null)}
        onShare={async () => {
          await shareFor(selected?.id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: ownerColors.primarySurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: ownerColors.primary,
    fontFamily: ownerFonts.bold,
  },
  statLabel: {
    fontSize: 11,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.medium,
  },
  offersSection: {
    borderWidth: 1,
    borderColor: "#FCD34D",
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  offersTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 10,
    fontFamily: ownerFonts.bold,
  },
  offerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 12,
    marginBottom: 8,
  },
  offerActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  acceptBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: ownerColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  declineBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.danger,
    backgroundColor: ownerColors.dangerMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    color: ownerColors.danger,
    fontWeight: "600",
    fontFamily: ownerFonts.semiBold,
  },
  search: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.card,
    marginBottom: 10,
    fontFamily: ownerFonts.regular,
  },
  chips: { gap: 8, paddingBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: ownerColors.card,
  },
  chipActive: {
    borderColor: ownerColors.primary,
    backgroundColor: ownerColors.primarySurface,
  },
  chipText: {
    fontSize: 13,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.medium,
  },
  chipTextActive: {
    color: ownerColors.primary,
    fontWeight: "600",
  },
  svcCard: {
    ...ownerStyles.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  svcName: {
    fontSize: 15,
    fontWeight: "700",
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  svcMeta: {
    fontSize: 12,
    color: ownerColors.textMuted,
    marginTop: 2,
    fontFamily: ownerFonts.regular,
  },
  commHint: {
    fontSize: 12,
    color: ownerColors.primary,
    marginTop: 4,
    fontFamily: ownerFonts.medium,
  },
  shareChip: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: ownerColors.bg,
  },
  shareChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: ownerColors.text,
    fontFamily: ownerFonts.semiBold,
  },
  emptyFiltered: {
    fontSize: 13,
    color: ownerColors.textDim,
    textAlign: "center",
    marginTop: 16,
    fontFamily: ownerFonts.regular,
  },
  disabled: { opacity: 0.6 },
});
