import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { OwnerSheetHeader } from "@/components/owner/OwnerSheetHeader";
import { ownerColors } from "@/constants/ownerTheme";
import type { StaffMember, StaffWorkingDay } from "@/types/owner";

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function defaultSchedule(): StaffWorkingDay[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    is_working: day >= 1 && day <= 5,
    start_time: "09:00",
    end_time: day === 6 ? "17:00" : "19:00",
  }));
}

function fromMember(member: StaffMember): StaffWorkingDay[] {
  if (member.working_hours?.length) {
    return member.working_hours.map((wh) => ({
      day: wh.day,
      is_working: wh.is_working,
      start_time: wh.start_time ?? "09:00",
      end_time: wh.end_time ?? "19:00",
    }));
  }
  return defaultSchedule();
}

interface Props {
  member: StaffMember | null;
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: StaffWorkingDay[]) => void;
  busy?: boolean;
}

export function StaffScheduleSheet({ member, visible, onClose, onSave, busy }: Props) {
  const [schedule, setSchedule] = useState<StaffWorkingDay[]>(defaultSchedule());

  useEffect(() => {
    if (member && visible) setSchedule(fromMember(member));
  }, [member, visible]);

  if (!member) return null;

  const updateDay = (day: number, patch: Partial<StaffWorkingDay>) => {
    setSchedule((prev) =>
      prev.map((row) => (row.day === day ? { ...row, ...patch } : row)),
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <OwnerSheetHeader
            title={`Horaires — ${member.display_name}`}
            onClose={onClose}
            disabled={busy}
            style={styles.sheetHeader}
          />
          <ScrollView>
            {schedule.map((row) => (
              <View key={row.day} style={styles.row}>
                <View style={styles.head}>
                  <Text style={styles.day}>{DAY_LABELS[row.day]}</Text>
                  <Switch
                    value={row.is_working}
                    onValueChange={(is_working) => updateDay(row.day, { is_working })}
                    trackColor={{ true: ownerColors.primary }}
                  />
                </View>
                {row.is_working ? (
                  <View style={styles.times}>
                    <TextInput
                      style={styles.input}
                      value={row.start_time ?? ""}
                      onChangeText={(start_time) => updateDay(row.day, { start_time })}
                    />
                    <Text style={styles.sep}>–</Text>
                    <TextInput
                      style={styles.input}
                      value={row.end_time ?? ""}
                      onChangeText={(end_time) => updateDay(row.day, { end_time })}
                    />
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
          <Pressable
            style={[styles.btn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => onSave(schedule)}>
            <Text style={styles.btnText}>{busy ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  title: { fontSize: 18, fontWeight: "700", color: ownerColors.text },
  sheetHeader: { marginBottom: 0 },
  row: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: ownerColors.bg,
  },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  day: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  times: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: ownerColors.text,
    backgroundColor: ownerColors.card,
  },
  sep: { color: ownerColors.textMuted },
  btn: {
    backgroundColor: ownerColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  disabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600" },
});
