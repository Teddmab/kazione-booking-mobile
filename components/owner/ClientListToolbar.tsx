import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { TabChipSelector } from "@/components/owner/TabChipSelector";
import { ownerColors } from "@/constants/ownerTheme";

interface Chip<T extends string> {
  key: T;
  label: string;
}

interface Props<TFilter extends string, TSort extends string> {
  searchOpen: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  filter: TFilter;
  filterChips: Chip<TFilter>[];
  onFilterChange: (value: TFilter) => void;
  sortBy: TSort;
  sortOptions: Chip<TSort>[];
  onSortChange: (value: TSort) => void;
  searchPlaceholder: string;
}

export function ClientListToolbar<TFilter extends string, TSort extends string>({
  searchOpen,
  search,
  onSearchChange,
  onSearchOpen,
  onSearchClose,
  filter,
  filterChips,
  onFilterChange,
  sortBy,
  sortOptions,
  onSortChange,
  searchPlaceholder,
}: Props<TFilter, TSort>) {
  const inputRef = useRef<TextInput>(null);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [searchOpen]);

  if (searchOpen) {
    return (
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={ownerColors.textDim} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          value={search}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={ownerColors.textDim}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            onSearchChange("");
            onSearchClose();
          }}
          accessibilityLabel="Fermer la recherche">
          <Ionicons name="close" size={20} color={ownerColors.textMuted} />
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <View style={styles.toolbar}>
        <Pressable
          style={styles.iconBtn}
          onPress={onSearchOpen}
          accessibilityLabel="Rechercher">
          <Ionicons name="search" size={20} color={ownerColors.primary} />
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}>
          <TabChipSelector value={filter} chips={filterChips} onChange={onFilterChange} />
        </ScrollView>

        <Pressable
          style={styles.sortBtn}
          onPress={() => setSortOpen(true)}
          accessibilityLabel="Trier">
          <Ionicons name="swap-vertical" size={18} color={ownerColors.textMuted} />
        </Pressable>
      </View>

      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.sortBackdrop} onPress={() => setSortOpen(false)}>
          <Pressable style={styles.sortSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sortTitle}>Trier par</Text>
            {sortOptions.map((opt) => {
              const active = sortBy === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.sortRow, active && styles.sortRowActive]}
                  onPress={() => {
                    onSortChange(opt.key);
                    setSortOpen(false);
                  }}>
                  <Text style={[styles.sortLabel, active && styles.sortLabelActive]}>{opt.label}</Text>
                  {active ? (
                    <Ionicons name="checkmark" size={18} color={ownerColors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 6,
  },
  chipsScroll: { flex: 1 },
  chipsContent: { paddingRight: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  sortBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ownerColors.border,
    backgroundColor: ownerColors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ownerColors.primary,
    backgroundColor: ownerColors.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: ownerColors.text,
    paddingVertical: 4,
  },
  sortBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sortSheet: {
    backgroundColor: ownerColors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sortTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: ownerColors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ownerColors.border,
  },
  sortRowActive: {
    backgroundColor: ownerColors.primarySurface,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sortLabel: { fontSize: 16, color: ownerColors.text },
  sortLabelActive: { color: ownerColors.primary, fontWeight: "600" },
});
