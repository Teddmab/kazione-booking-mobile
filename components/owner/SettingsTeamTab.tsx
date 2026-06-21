import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ownerColors, ownerStyles } from "@/constants/ownerTheme";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_MODULES,
  ROLE_LABELS,
  type RoleKey,
  type RolePermissions,
} from "@/lib/settingsConstants";

interface Props {
  permissions: RolePermissions;
  onChange: (next: RolePermissions) => void;
  onSave: () => void;
  busy?: boolean;
}

export function SettingsTeamTab({ permissions, onChange, onSave, busy }: Props) {
  const [expandedRole, setExpandedRole] = useState<RoleKey | null>(null);

  const togglePermission = (role: RoleKey, moduleKey: string, checked: boolean) => {
    if (role === "owner") return;

    if (!checked && role === "staff" && permissions.receptionist[moduleKey]) {
      Alert.alert(
        "Attention",
        "Cela désactivera aussi l'accès pour les réceptionnistes. Continuer ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Confirmer",
            onPress: () => {
              onChange({
                ...permissions,
                staff: { ...permissions.staff, [moduleKey]: false },
                receptionist: { ...permissions.receptionist, [moduleKey]: false },
              });
            },
          },
        ],
      );
      return;
    }

    onChange({
      ...permissions,
      [role]: { ...permissions[role], [moduleKey]: checked },
    });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Accès par rôle</Text>
      <Text style={styles.desc}>
        Définissez quels modules chaque rôle peut utiliser. Les permissions gérant restent
        verrouillées.
      </Text>

      {(Object.keys(ROLE_LABELS) as RoleKey[]).map((role) => {
        const meta = ROLE_LABELS[role];
        const expanded = expandedRole === role;
        return (
          <View key={role} style={styles.roleBlock}>
            <Pressable
              style={styles.roleHeader}
              onPress={() => setExpandedRole(expanded ? null : role)}>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{meta.title}</Text>
                <Text style={styles.roleDesc}>{meta.desc}</Text>
              </View>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={ownerColors.textMuted}
              />
            </Pressable>

            {expanded ? (
              <View style={styles.permList}>
                {PERMISSION_MODULES.map((module) => (
                  <View key={module.key} style={styles.permRow}>
                    <Text style={styles.permLabel}>{module.label}</Text>
                    {role === "owner" ? (
                      <Ionicons name="lock-closed" size={18} color={ownerColors.primary} />
                    ) : (
                      <Switch
                        value={permissions[role][module.key] ?? false}
                        onValueChange={(checked) => togglePermission(role, module.key, checked)}
                        trackColor={{ true: ownerColors.primary }}
                      />
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}

      <Pressable
        style={[ownerStyles.primaryBtn, styles.saveBtn, busy && styles.disabled]}
        disabled={busy}
        onPress={onSave}>
        <Text style={ownerStyles.primaryBtnText}>Enregistrer les permissions</Text>
      </Pressable>
    </View>
  );
}

export function createDefaultRolePermissions(): RolePermissions {
  return JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)) as RolePermissions;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ownerColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ownerColors.border,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  title: { fontSize: 15, fontWeight: "700", color: ownerColors.text },
  desc: { fontSize: 13, color: ownerColors.textMuted, marginTop: 6, lineHeight: 18 },
  roleBlock: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  roleHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: ownerColors.bg,
    gap: 8,
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 14, fontWeight: "600", color: ownerColors.text },
  roleDesc: { fontSize: 12, color: ownerColors.textMuted, marginTop: 2 },
  permList: { paddingHorizontal: 12, paddingBottom: 8 },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ownerColors.border,
  },
  permLabel: { fontSize: 14, color: ownerColors.text, flex: 1 },
  saveBtn: { marginTop: 16 },
  disabled: { opacity: 0.7 },
});
