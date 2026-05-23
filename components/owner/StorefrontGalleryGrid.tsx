import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { SafeImage } from "@/components/SafeImage";
import { ownerColors } from "@/constants/ownerTheme";
import { pickImage } from "@/lib/imageUpload";
import type { GalleryItem } from "@/types/owner";

const MAX_GALLERY = 20;

type Props = {
  images: GalleryItem[];
  uploading?: boolean;
  onAdd: (uris: string[]) => void;
  onRemove: (item: GalleryItem) => void;
};

export function StorefrontGalleryGrid({ images, uploading, onAdd, onRemove }: Props) {
  const { t } = useTranslation();

  const pick = async () => {
    if (images.length >= MAX_GALLERY) {
      Alert.alert(t("owner.galleryMax"));
      return;
    }
    try {
      const assets = await pickImage({ allowsMultiple: true });
      if (!assets?.length) return;
      const remaining = MAX_GALLERY - images.length;
      onAdd(assets.slice(0, remaining).map((a) => a.uri));
    } catch (err) {
      Alert.alert(t("owner.uploadFailed"), err instanceof Error ? err.message : "");
    }
  };

  const confirmRemove = (item: GalleryItem) => {
    Alert.alert(t("owner.galleryRemoveTitle"), t("owner.galleryRemoveMsg"), [
      { text: t("owner.cancel"), style: "cancel" },
      { text: t("owner.remove"), style: "destructive", onPress: () => onRemove(item) },
    ]);
  };

  return (
    <View>
      <Text style={styles.count}>
        {t("owner.galleryCount", { count: images.length, max: MAX_GALLERY })}
      </Text>
      <View style={styles.grid}>
        {images.map((item) => (
          <Pressable key={item.id} style={styles.cell} onLongPress={() => confirmRemove(item)}>
            <SafeImage uri={item.image_url} style={styles.image} fallbackLetter="?" />
          </Pressable>
        ))}
        {images.length < MAX_GALLERY ? (
          <Pressable style={[styles.cell, styles.addCell]} onPress={() => void pick()} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={ownerColors.primary} />
            ) : (
              <Text style={styles.addText}>+</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  count: { fontSize: 13, color: ownerColors.textMuted, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: ownerColors.border,
  },
  image: { width: "100%", height: "100%" },
  addCell: {
    borderWidth: 1,
    borderColor: ownerColors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ownerColors.card,
  },
  addText: { fontSize: 28, color: ownerColors.primary, fontWeight: "300" },
});
