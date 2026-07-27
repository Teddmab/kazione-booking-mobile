import { Pressable, StyleSheet, Text } from "react-native";

import { ownerColors, ownerFonts } from "@/constants/ownerTheme";
import { APPOINTMENT_BLOCK_COLORS } from "@/lib/ownerCalendar";
import type { StaffAppointment } from "@/services/staff/appointments";

interface Props {
  appt: StaffAppointment;
  top: number;
  height: number;
  colOffset: number;
  colCount: number;
  colWidth: number;
  onPress: (a: StaffAppointment) => void;
}

export function ApptBlock({
  appt,
  top,
  height,
  colOffset,
  colCount,
  colWidth,
  onPress,
}: Props) {
  const colors = APPOINTMENT_BLOCK_COLORS[appt.status] ?? APPOINTMENT_BLOCK_COLORS.pending;
  const blockWidth = colWidth / colCount - 2;
  const left = colOffset * (colWidth / colCount) + 1;
  const short = height < 40;

  return (
    <Pressable
      onPress={() => onPress(appt)}
      style={[
        styles.block,
        {
          top,
          height: Math.max(height, 18),
          width: Math.max(blockWidth, 8),
          left,
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
        },
      ]}>
      <Text style={styles.clientName} numberOfLines={1}>
        {appt.client.first_name} {appt.client.last_name}
      </Text>
      {!short ? (
        <Text style={styles.serviceName} numberOfLines={1}>
          {appt.service.name}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    position: "absolute",
    borderLeftWidth: 2,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    overflow: "hidden",
  },
  clientName: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
    color: ownerColors.text,
    fontFamily: ownerFonts.bold,
  },
  serviceName: {
    fontSize: 9,
    lineHeight: 12,
    color: ownerColors.textMuted,
    fontFamily: ownerFonts.regular,
  },
});
