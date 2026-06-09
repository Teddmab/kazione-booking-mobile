import { StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ownerColors } from "@/constants/ownerTheme";
import { WEEKDAYS } from "@/lib/operatingHours";
import type { DayHours } from "@/types/owner";

interface Props {
  hours: Record<string, DayHours>;
  onChange: (hours: Record<string, DayHours>) => void;
}

export function OperatingHoursEditor({ hours, onChange }: Props) {
  const updateDay = (day: string, patch: Partial<DayHours>) => {
    onChange({
      ...hours,
      [day]: { ...hours[day], ...patch },
    });
  };

  return (
    <View style={styles.wrap}>
      {WEEKDAYS.map((day) => {
        const row = hours[day];
        return (
          <View key={day} style={styles.row}>
            <View style={styles.dayHead}>
              <Text style={styles.dayLabel}>{day}</Text>
              <Switch
                value={row.open}
                onValueChange={(open) => updateDay(day, { open })}
                trackColor={{ true: ownerColors.primary }}
              />
            </View>
            {row.open ? (
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  value={row.start}
                  onChangeText={(start) => updateDay(day, { start })}
                  placeholder="09:00"
                  autoCapitalize="none"
                />
                <Text style={styles.sep}>–</Text>
                <TextInput
                  style={styles.timeInput}
                  value={row.end}
                  onChangeText={(end) => updateDay(day, { end })}
                  placeholder="19:00"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <Text style={styles.closed}>Fermé</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  row: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: ownerColors.bg,
  },
  dayHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayLabel: { fontSize: 15, fontWeight: "600", color: ownerColors.text },
  timeRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: ownerColors.text,
    backgroundColor: ownerColors.card,
  },
  sep: { color: ownerColors.textMuted },
  closed: { marginTop: 6, fontSize: 13, color: ownerColors.textMuted },
});
