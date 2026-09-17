import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { OwnerStackShell } from "@/components/owner/OwnerStackShell";
import { QueryState } from "@/components/owner/QueryState";
import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { useTenantContext } from "@/contexts/TenantContext";
import { useToast } from "@/contexts/ToastContext";
import { useOwnerClients } from "@/hooks/useOwnerClients";
import {
  useCreateOwnerOffer,
  useDeactivateOwnerOffer,
  useOwnerOfferRedemptions,
  useOwnerOffers,
  useSellOwnerOffer,
} from "@/hooks/useOwnerOffers";
import { formatCurrency } from "@/lib/format";
import type { BusinessOffer, OfferType } from "@/services/owner/offers";

type Tab = "catalog" | "redemptions";

const TYPE_STYLE: Record<
  OfferType,
  { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string; border: string }
> = {
  appointment_discount: { icon: "pricetag-outline", bg: "#EFF6FF", fg: "#1D4ED8", border: "#BFDBFE" },
  package: { icon: "cube-outline", bg: "#F5F3FF", fg: "#6D28D9", border: "#DDD6FE" },
  training: { icon: "school-outline", bg: "#EEF2FF", fg: "#4338CA", border: "#C7D2FE" },
  gift_voucher: { icon: "gift-outline", bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0" },
};

const STATUS_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  pending: { bg: "#FFFBEB", fg: "#B45309", border: "#FDE68A" },
  active: { bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0" },
  completed: { bg: ownerColors.primarySurface, fg: ownerColors.textMuted, border: ownerColors.border },
  cancelled: { bg: "#FEF2F2", fg: "#B91C1C", border: "#FECACA" },
};

function offerSummary(offer: BusinessOffer): string {
  if (offer.type === "appointment_discount") {
    return offer.discount_type === "percentage"
      ? `${offer.discount_value ?? 0}%`
      : formatCurrency(offer.discount_value ?? 0, offer.currency_code);
  }
  if (offer.type === "gift_voucher") {
    return formatCurrency(offer.price ?? 0, offer.currency_code);
  }
  return `${offer.sessions_total ?? 0} · ${formatCurrency(offer.price ?? 0, offer.currency_code)}`;
}

export default function OwnerOffersScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { tenant } = useTenantContext();
  const businessId = tenant?.businessId ?? "";
  const [tab, setTab] = useState<Tab>("catalog");
  const [createOpen, setCreateOpen] = useState(false);
  const [sellOfferId, setSellOfferId] = useState<string | null>(null);

  const offersQ = useOwnerOffers(businessId, true);
  const redemptionsQ = useOwnerOfferRedemptions(businessId);
  const createOffer = useCreateOwnerOffer(businessId);
  const sellOffer = useSellOwnerOffer(businessId);
  const deactivate = useDeactivateOwnerOffer(businessId);

  const offers = offersQ.data ?? [];
  const redemptions = redemptionsQ.data ?? [];
  const activeOffers = offers.filter((o) => o.is_active);
  const pendingPay = redemptions.filter((r) => r.status === "pending").length;

  return (
    <OwnerStackShell
      title={t("owner.offers")}
      subtitle={t("owner.offersSub")}
      rightSlot={
        <Pressable style={styles.headerBtn} onPress={() => setCreateOpen(true)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.headerBtnText}>{t("owner.offerNew")}</Text>
        </Pressable>
      }>
      <View style={styles.stats}>
        <Stat label={t("owner.offerActiveCount")} value={String(activeOffers.length)} />
        <Stat label={t("owner.offerRedemptionsCount")} value={String(redemptions.length)} />
        <Stat label={t("owner.offerPendingPay")} value={String(pendingPay)} />
      </View>
      <View style={styles.pad}>
        <TabChipSelector
          value={tab}
          onChange={setTab}
          chips={[
            { key: "catalog", label: t("owner.offersCatalog") },
            { key: "redemptions", label: t("owner.offersSold") },
          ]}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === "catalog" ? (
          <QueryState
            loading={offersQ.isLoading}
            error={offersQ.isError ? (offersQ.error as Error) : null}
            empty={!offersQ.isLoading && offers.length === 0}
            emptyMessage={t("owner.offersEmpty")}
            onRetry={() => void offersQ.refetch()}>
            {offers.map((offer) => {
              const meta = TYPE_STYLE[offer.type];
              return (
                <View
                  key={offer.id}
                  style={[styles.card, !offer.is_active && styles.cardDim]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.typeIcon, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                      <Ionicons name={meta.icon} size={16} color={meta.fg} />
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>
                          {offer.title}
                        </Text>
                        {offer.publish_status === "draft" ? (
                          <Text style={styles.draft}>{t("owner.offerDraft")}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.meta}>
                        {t(`owner.offerType_${offer.type}`)} · {offerSummary(offer)}
                      </Text>
                    </View>
                  </View>
                  {offer.description ? (
                    <Text style={styles.desc} numberOfLines={2}>
                      {offer.description}
                    </Text>
                  ) : null}
                  <View style={styles.rowBtns}>
                    {offer.is_active ? (
                      <Pressable
                        style={styles.outlineBtn}
                        onPress={() => setSellOfferId(offer.id)}>
                        <Ionicons name="people-outline" size={14} color={ownerColors.primary} />
                        <Text style={styles.outlineBtnText}>{t("owner.offerSell")}</Text>
                      </Pressable>
                    ) : null}
                    {offer.is_active ? (
                      <Pressable
                        style={styles.ghostBtn}
                        onPress={() =>
                          Alert.alert(
                            t("owner.offerArchive"),
                            t("owner.offerArchiveConfirm"),
                            [
                              { text: t("owner.cancel"), style: "cancel" },
                              {
                                text: t("owner.offerArchive"),
                                style: "destructive",
                                onPress: () =>
                                  deactivate.mutate(offer.id, {
                                    onError: (err: Error) =>
                                      toast.error(t("owner.offers"), err.message),
                                  }),
                              },
                            ],
                          )
                        }>
                        <Text style={styles.ghostBtnText}>{t("owner.offerArchive")}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </QueryState>
        ) : (
          <QueryState
            loading={redemptionsQ.isLoading}
            error={redemptionsQ.isError ? (redemptionsQ.error as Error) : null}
            empty={!redemptionsQ.isLoading && redemptions.length === 0}
            emptyMessage={t("owner.redemptionsEmpty")}
            onRetry={() => void redemptionsQ.refetch()}>
            {redemptions.map((r) => {
              const name = r.clients
                ? `${r.clients.first_name} ${r.clients.last_name}`.trim()
                : "—";
              const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.active;
              return (
                <View key={r.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardBody}>
                      <Text style={styles.title}>
                        {r.business_offers?.title ?? t("owner.offers")}
                      </Text>
                      <Text style={styles.meta}>{name}</Text>
                    </View>
                    <View style={[styles.status, { backgroundColor: st.bg, borderColor: st.border }]}>
                      <Text style={[styles.statusText, { color: st.fg }]}>
                        {t(`owner.redemption_${r.status}`)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </QueryState>
        )}
      </ScrollView>

      <CreateOfferSheet
        visible={createOpen}
        busy={createOffer.isPending}
        onClose={() => setCreateOpen(false)}
        onSave={(payload) => {
          createOffer.mutate(payload, {
            onSuccess: () => {
              setCreateOpen(false);
              toast.success(t("owner.offers"), t("owner.offerCreated"));
            },
            onError: (err: Error) => toast.error(t("owner.offers"), err.message),
          });
        }}
      />

      <SellOfferSheet
        visible={!!sellOfferId}
        offerId={sellOfferId}
        offers={activeOffers}
        businessId={businessId}
        busy={sellOffer.isPending}
        onClose={() => setSellOfferId(null)}
        onSell={(clientId) => {
          if (!sellOfferId) return;
          sellOffer.mutate(
            { offer_id: sellOfferId, client_id: clientId },
            {
              onSuccess: () => {
                setSellOfferId(null);
                toast.success(t("owner.offers"), t("owner.offerSold"));
              },
              onError: (err: Error) => toast.error(t("owner.offers"), err.message),
            },
          );
        }}
      />
    </OwnerStackShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

function CreateOfferSheet({
  visible,
  busy,
  onClose,
  onSave,
}: {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (data: {
    type: OfferType;
    title: string;
    discount_type?: "percentage" | "fixed_amount";
    discount_value?: number;
    price?: number;
    sessions_total?: number;
  }) => void;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<OfferType>("gift_voucher");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [sessions, setSessions] = useState("5");
  const types: OfferType[] = ["gift_voucher", "appointment_discount", "package"];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{t("owner.offerNew")}</Text>
        <View style={styles.typeGrid}>
          {types.map((key) => {
            const meta = TYPE_STYLE[key];
            const on = type === key;
            return (
              <Pressable
                key={key}
                onPress={() => setType(key)}
                style={[
                  styles.typePick,
                  { backgroundColor: meta.bg, borderColor: on ? meta.fg : meta.border },
                ]}>
                <Ionicons name={meta.icon} size={16} color={meta.fg} />
                <Text style={[styles.typePickText, { color: meta.fg }]}>
                  {t(`owner.offerType_${key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          style={styles.input}
          placeholder={t("owner.offerTitlePh")}
          placeholderTextColor={ownerColors.textDim}
          value={title}
          onChangeText={setTitle}
        />
        {type === "appointment_discount" ? (
          <TextInput
            style={styles.input}
            placeholder={t("owner.offerPercentPh")}
            keyboardType="decimal-pad"
            value={value}
            onChangeText={setValue}
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder={t("owner.offerPricePh")}
            keyboardType="decimal-pad"
            value={value}
            onChangeText={setValue}
          />
        )}
        {type === "package" ? (
          <TextInput
            style={styles.input}
            placeholder={t("owner.offerSessionsPh")}
            keyboardType="number-pad"
            value={sessions}
            onChangeText={setSessions}
          />
        ) : null}
        <Pressable
          style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
          disabled={busy || !title.trim()}
          onPress={() => {
            const n = Number(value.replace(",", "."));
            if (type === "appointment_discount") {
              onSave({
                type,
                title: title.trim(),
                discount_type: "percentage",
                discount_value: n || 0,
              });
            } else if (type === "package") {
              onSave({
                type,
                title: title.trim(),
                price: n || 0,
                sessions_total: Number(sessions) || 1,
              });
            } else {
              onSave({ type, title: title.trim(), price: n || 0 });
            }
          }}>
          <Text style={styles.primaryBtnText}>{t("common.save")}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function SellOfferSheet({
  visible,
  offerId,
  offers,
  businessId,
  busy,
  onClose,
  onSell,
}: {
  visible: boolean;
  offerId: string | null;
  offers: { id: string; title: string }[];
  businessId: string;
  busy: boolean;
  onClose: () => void;
  onSell: (clientId: string) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const clientsQ = useOwnerClients(businessId, { search, limit: 30 });
  const clients = clientsQ.data?.clients ?? [];
  const offer = useMemo(
    () => offers.find((o) => o.id === offerId),
    [offers, offerId],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>{t("owner.offerSell")}</Text>
        <Text style={styles.meta}>{offer?.title}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("owner.walkInSearchClients")}
          placeholderTextColor={ownerColors.textDim}
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView style={{ maxHeight: 240 }}>
          {clients.map((c) => {
            const name = `${c.first_name} ${c.last_name}`.trim();
            const active = clientId === c.id;
            return (
              <Pressable
                key={c.id}
                style={[styles.clientRow, active && styles.clientRowActive]}
                onPress={() => setClientId(c.id)}>
                <Text style={styles.clientName}>{name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          style={[styles.primaryBtn, (!clientId || busy) && { opacity: 0.6 }]}
          disabled={!clientId || busy}
          onPress={() => clientId && onSell(clientId)}>
          <Text style={styles.primaryBtnText}>{t("owner.offerSell")}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 16, paddingTop: 4 },
  scroll: { padding: 16, paddingBottom: 40 },
  headerBtn: {
    backgroundColor: ownerColors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerBtnText: { color: "#fff", fontSize: 13, fontFamily: ownerFonts.semiBold },
  stats: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  stat: {
    flex: 1,
    backgroundColor: ownerColors.card,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
  },
  statVal: { fontFamily: ownerFonts.bold, fontSize: 20, color: ownerColors.text },
  statLbl: { fontSize: 11, color: ownerColors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  cardDim: { opacity: 0.55 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { flex: 1, fontSize: 15, fontFamily: ownerFonts.semiBold, color: ownerColors.text },
  draft: { fontSize: 10, color: "#D97706", fontFamily: ownerFonts.medium },
  meta: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  desc: { fontSize: 12, color: ownerColors.textMuted },
  rowBtns: { flexDirection: "row", gap: 8 },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  outlineBtnText: { color: ownerColors.primary, fontFamily: ownerFonts.semiBold, fontSize: 13 },
  ghostBtn: { justifyContent: "center", paddingHorizontal: 8 },
  ghostBtnText: { color: ownerColors.danger, fontFamily: ownerFonts.medium, fontSize: 13 },
  status: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontFamily: ownerFonts.medium },
  primaryBtn: {
    backgroundColor: ownerColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontFamily: ownerFonts.semiBold },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  sheetTitle: { fontSize: 18, fontFamily: ownerFonts.bold, color: ownerColors.text },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typePick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  typePickText: { fontSize: 12, fontFamily: ownerFonts.semiBold },
  input: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: ownerColors.text,
  },
  clientRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: ownerColors.border },
  clientRowActive: { backgroundColor: ownerColors.primaryMuted },
  clientName: { fontSize: 15, color: ownerColors.text },
});
