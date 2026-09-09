import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { AddExceptionSheet } from "@/components/staff/AddExceptionSheet";
import { AppointmentStatusSheet } from "@/components/staff/AppointmentStatusSheet";
import { BookingDayStrip } from "@/components/staff/calendar/BookingDayStrip";
import { BookingDayTimeline } from "@/components/staff/calendar/BookingDayTimeline";
import { WeekNav } from "@/components/staff/calendar/WeekNav";
import { WeekPickerModal } from "@/components/staff/calendar/WeekPickerModal";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { VoucherScanSheet } from "@/components/staff/VoucherScanSheet";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useStaffAppointments } from "@/hooks/useStaffAppointments";
import { useUpsertSelfOverride } from "@/hooks/useStaffSelf";
import { addDays, startOfWeekMonday, toIsoDateLocal } from "@/lib/staffCalendar";
import type { StaffAppointment } from "@/services/staff/appointments";

const WEEK_KEY = "staff_calendar_week_start";
const DAY_KEY = "staff_calendar_selected_day";

export default function StaffCalendarScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toIsoDateLocal(new Date()));
  const [selected, setSelected] = useState<StaffAppointment | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionDefaults, setExceptionDefaults] = useState<{
    type: "day_off" | "custom";
    start: string;
    end: string;
  }>({ type: "day_off", start: "10:00", end: "14:00" });
  const [hydrated, setHydrated] = useState(false);

  const upsertOverride = useUpsertSelfOverride();

  useEffect(() => {
    void Promise.all([
      AsyncStorage.getItem(WEEK_KEY),
      AsyncStorage.getItem(DAY_KEY),
    ]).then(([week, day]) => {
      if (week) {
        const d = new Date(week);
        if (!Number.isNaN(d.getTime())) setWeekStart(startOfWeekMonday(d));
      }
      if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) setSelectedDate(day);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(WEEK_KEY, weekStart.toISOString());
  }, [weekStart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(DAY_KEY, selectedDate);
  }, [selectedDate, hydrated]);

  // Keep selected day inside the visible week after week changes.
  useEffect(() => {
    const from = toIsoDateLocal(weekStart);
    const to = toIsoDateLocal(addDays(weekStart, 6));
    if (selectedDate < from || selectedDate > to) {
      setSelectedDate(from);
    }
  }, [weekStart, selectedDate]);

  const weekFrom = toIsoDateLocal(weekStart);
  const weekTo = toIsoDateLocal(addDays(weekStart, 6));
  const weekQ = useStaffAppointments(weekFrom, weekTo, 200);

  const weekAppts = useMemo(
    () =>
      (weekQ.data ?? []).filter(
        (a) => a.status !== "cancelled" && a.status !== "no_show",
      ),
    [weekQ.data],
  );

  const countsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of weekAppts) {
      const d = a.starts_at.slice(0, 10);
      map[d] = (map[d] ?? 0) + 1;
    }
    return map;
  }, [weekAppts]);

  const dayAppts = useMemo(
    () =>
      weekAppts
        .filter((a) => a.starts_at.slice(0, 10) === selectedDate)
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
        ),
    [weekAppts, selectedDate],
  );

  function goToday() {
    const now = new Date();
    setWeekStart(startOfWeekMonday(now));
    setSelectedDate(toIsoDateLocal(now));
  }

  function jumpToDate(iso: string) {
    const d = new Date(`${iso}T12:00:00`);
    setWeekStart(startOfWeekMonday(d));
    setSelectedDate(iso);
  }

  function shiftWeek(delta: number) {
    const next = addDays(weekStart, delta * 7);
    setWeekStart(next);
    const from = toIsoDateLocal(next);
    const to = toIsoDateLocal(addDays(next, 6));
    if (selectedDate < from || selectedDate > to) {
      setSelectedDate(from);
    }
  }

  function openUnavailability(
    type: "day_off" | "custom" = "day_off",
    start = "10:00",
    end = "14:00",
  ) {
    setExceptionDefaults({ type, start, end });
    setExceptionOpen(true);
  }

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={t("staffCalendar.title")}
        subtitle={t("staffCalendar.subtitleDay")}
        displayTitle
        rightSlot={
          <Pressable
            style={styles.scanBtn}
            onPress={() => setVoucherOpen(true)}>
            <Ionicons name="qr-code-outline" size={14} color={colors.primary} />
            <Text style={styles.scanBtnText}>{t("staffCalendar.scan")}</Text>
          </Pressable>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={weekQ.isRefetching}
            onRefresh={() => void weekQ.refetch()}
            tintColor={colors.primary}
          />
        }>
        <View style={styles.padH}>
          <WeekNav
            weekStart={weekStart}
            onPrev={() => shiftWeek(-1)}
            onNext={() => shiftWeek(1)}
            onToday={goToday}
            onOpenPicker={() => setPickerOpen(true)}
          />
        </View>

        <BookingDayStrip
          weekStart={weekStart}
          selectedDate={selectedDate}
          countsByDate={countsByDate}
          onSelect={setSelectedDate}
        />

        <View style={styles.padH}>
          <Pressable style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color={colors.textMuted} />
            <Text style={styles.filterText}>
              {t("staffCalendar.filterMine")}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textDim} />
          </Pressable>
        </View>

        <View style={styles.padH}>
          {weekQ.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : weekQ.isError ? (
            <Text style={styles.errorText}>{t("staffCalendar.errorLoad")}</Text>
          ) : (
            <BookingDayTimeline
              appointments={dayAppts}
              onPressAppt={setSelected}
              onBlockGap={(start, end) => openUnavailability("custom", start, end)}
            />
          )}
        </View>
      </ScrollView>

      <View style={[styles.fabWrap, { bottom: 16 + insets.bottom }]}>
        <Pressable
          style={styles.fab}
          onPress={() => openUnavailability("day_off")}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.fabText}>
            {t("staffCalendar.addUnavailability")}
          </Text>
        </Pressable>
      </View>

      <AppointmentStatusSheet
        appointment={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
      <VoucherScanSheet
        visible={voucherOpen}
        onClose={() => setVoucherOpen(false)}
      />
      <WeekPickerModal
        visible={pickerOpen}
        weekStart={weekStart}
        selectedDate={selectedDate}
        onClose={() => setPickerOpen(false)}
        onSelectDate={jumpToDate}
      />
      <AddExceptionSheet
        visible={exceptionOpen}
        onClose={() => setExceptionOpen(false)}
        defaultDate={selectedDate}
        defaultType={exceptionDefaults.type}
        defaultStartTime={exceptionDefaults.start}
        defaultEndTime={exceptionDefaults.end}
        busy={upsertOverride.isPending}
        onSave={(override) => {
          upsertOverride.mutate(override, {
            onSuccess: () => {
              setExceptionOpen(false);
              toast.success(
                t("staffCalendar.unavailabilitySavedTitle"),
                t("staffCalendar.unavailabilitySavedBody"),
              );
            },
            onError: (err: Error) =>
              toast.error(t("staffCalendar.error"), err.message),
          });
        }}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { gap: 12, paddingTop: 8 },
    padH: { paddingHorizontal: 16 },
    scanBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    scanBtnText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    filterBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    filterText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    errorText: {
      fontSize: 13,
      color: colors.danger,
      textAlign: "center",
      marginTop: 24,
      fontFamily: ownerFonts.medium,
    },
    fabWrap: {
      position: "absolute",
      left: 16,
      right: 16,
    },
    fab: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    fabText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
  });
}
