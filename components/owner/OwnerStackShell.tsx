import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { OwnerAppBar } from "@/components/owner/OwnerAppBar";
import { ownerColors } from "@/constants/ownerTheme";

interface Props {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
}

/** Keeps stack sections inside the owner dashboard shell (drawer + app bar). */
export function OwnerStackShell({ title, subtitle, rightSlot, children }: Props) {
  return (
    <View style={styles.flex}>
      <OwnerAppBar title={title} subtitle={subtitle} rightSlot={rightSlot} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: ownerColors.bg },
});
