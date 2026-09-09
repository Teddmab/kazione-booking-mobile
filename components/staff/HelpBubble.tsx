import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { WebView } from "react-native-webview";

import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useHelp, type HelpItem } from "@/hooks/useHelp";

type Props = {
  /** Logical path used by public-help seed (web uses router pathname). */
  targetPath?: string;
  section: string;
  portal?: "owner" | "staff";
};

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/]+)/,
  );
  return m?.[1] ?? null;
}

function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] ?? null;
}

function embedUrl(url: string): string | null {
  const yt = youtubeId(url);
  if (yt) {
    return `https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1&playsinline=1`;
  }
  const vimeo = vimeoId(url);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo}?playsinline=1`;
  }
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|m3u8|webm|mov)(\?|$)/i.test(url);
}

function playerSource(url: string): { uri: string } | { html: string } {
  const embed = embedUrl(url);
  if (embed) return { uri: embed };
  if (isDirectVideo(url)) {
    return {
      html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/><style>*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;background:#000}video{width:100%;height:100%;object-fit:contain}</style></head><body><video src="${url}" controls playsinline webkit-playsinline autoplay></video></body></html>`,
    };
  }
  // Generic fallback: load URL in webview (still in-app, no browser redirect)
  return { uri: url };
}

export function HelpBubble({
  targetPath = "/staff",
  section,
  portal = "staff",
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { data: items = [] } = useHelp(targetPath, portal);
  const [open, setOpen] = useState(false);

  const matched = items.filter((i) => i.target_section === section);
  if (matched.length === 0) return null;

  const item = matched[0];

  return (
    <>
      <Pressable
        style={styles.bubble}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Help">
        <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
      </Pressable>
      <HelpViewer item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function InlineVideoPlayer({
  url,
  style,
}: {
  url: string;
  style?: object;
}) {
  const [loading, setLoading] = useState(true);
  const source = useMemo(() => playerSource(url), [url]);

  return (
    <View style={[stylesBase.playerWrap, style]}>
      <WebView
        source={source}
        style={stylesBase.webview}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        setSupportMultipleWindows={false}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading ? (
        <View style={stylesBase.loader}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
    </View>
  );
}

function HelpViewer({
  item,
  open,
  onClose,
}: {
  item: HelpItem;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    async function syncOrientation() {
      try {
        if (expanded) {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.LANDSCAPE,
          );
        } else {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP,
          );
        }
      } catch {
        // Expo Go / web may ignore orientation locks — ignore.
      }
      if (cancelled) return;
    }
    void syncOrientation();
    return () => {
      cancelled = true;
    };
  }, [expanded]);

  useEffect(() => {
    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => undefined);
    };
  }, []);

  function handleClose() {
    setExpanded(false);
    onClose();
  }

  return (
    <>
      <Modal
        visible={open && !expanded}
        animationType="slide"
        transparent
        onRequestClose={handleClose}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={handleClose} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>{item.title}</Text>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: 520 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingBottom: 4 }}>
              {item.video_url ? (
                <View style={styles.videoFrame}>
                  <InlineVideoPlayer url={item.video_url} />
                  <Pressable
                    style={styles.expandBtn}
                    onPress={() => setExpanded(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t("staffHelp.expandVideo")}>
                    <Ionicons name="expand-outline" size={18} color="#fff" />
                    <Text style={styles.expandBtnText}>
                      {t("staffHelp.expandVideo")}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {item.description ? (
                <Text style={styles.desc}>{item.description}</Text>
              ) : null}

              {!item.video_url && !item.description ? (
                <Text style={styles.desc}>{t("staffHelp.noContent")}</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Landscape fullscreen — same player, no external redirect */}
      <Modal
        visible={open && expanded}
        animationType="fade"
        supportedOrientations={["landscape", "landscape-left", "landscape-right"]}
        onRequestClose={() => setExpanded(false)}>
        <View style={[styles.fullscreen, { paddingTop: insets.top }]}>
          <View style={styles.fullscreenBar}>
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Pressable
              style={styles.fullscreenClose}
              onPress={() => setExpanded(false)}
              hitSlop={12}>
              <Ionicons name="contract-outline" size={20} color="#fff" />
              <Text style={styles.expandBtnText}>{t("staffHelp.shrinkVideo")}</Text>
            </Pressable>
          </View>
          {item.video_url ? (
            <InlineVideoPlayer
              url={item.video_url}
              style={styles.fullscreenPlayer}
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const stylesBase = StyleSheet.create({
  playerWrap: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bubble: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySurface,
    },
    modalRoot: { flex: 1, justifyContent: "flex-end" },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sheetHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sheetTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
      marginRight: 12,
    },
    desc: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    videoFrame: {
      width: "100%",
      aspectRatio: 16 / 9,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#000",
    },
    expandBtn: {
      position: "absolute",
      right: 10,
      bottom: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.7)",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      zIndex: 3,
    },
    expandBtnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
    },
    fullscreen: {
      flex: 1,
      backgroundColor: "#000",
    },
    fullscreenBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 12,
    },
    fullscreenTitle: {
      flex: 1,
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    fullscreenClose: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    fullscreenPlayer: {
      flex: 1,
      marginHorizontal: 8,
      marginBottom: 8,
      borderRadius: 8,
      overflow: "hidden",
    },
  });
}
