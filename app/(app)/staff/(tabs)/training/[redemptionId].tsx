import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { QueryState } from "@/components/owner/QueryState";
import { StaffAppBar } from "@/components/staff/StaffAppBar";
import { ownerFonts } from "@/constants/ownerTheme";
import { useThemeColors, type ThemeColors } from "@/contexts/AppThemeContext";
import { useToast } from "@/contexts/ToastContext";
import {
  useMarkSectionComplete,
  usePlayerData,
} from "@/hooks/useStaffTraining";
import {
  trainingLocalized,
  trainingPlainText,
  type QuizContent,
  type TrainingContentType,
  type TrainingSection,
} from "@/services/staff/training";

function contentIcon(type: TrainingContentType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "video":
      return "play-circle-outline";
    case "image":
      return "image-outline";
    case "quiz":
      return "help-circle-outline";
    default:
      return "document-text-outline";
  }
}

function parseQuiz(raw: string | null): QuizContent | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QuizContent;
  } catch {
    return null;
  }
}

function SectionBody({
  section,
  completed,
  pending,
  locale,
  onComplete,
  styles,
  colors,
}: {
  section: TrainingSection;
  completed: boolean;
  pending: boolean;
  locale: string;
  onComplete: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const { t } = useTranslation();
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    setQuizSelected(null);
    setQuizSubmitted(false);
  }, [section.id]);

  const rawText = trainingLocalized(
    section.content_text_i18n,
    section.content_text ?? "",
    locale,
  );

  if (section.content_type === "video") {
    return (
      <View style={styles.bodyBlock}>
        {section.video_url ? (
          <Pressable
            style={styles.videoCard}
            onPress={() => void Linking.openURL(section.video_url!)}>
            <Ionicons name="play-circle" size={40} color={colors.primary} />
            <Text style={styles.videoCardText}>{t("staffTraining.openVideo")}</Text>
          </Pressable>
        ) : (
          <Text style={styles.muted}>{t("staffTraining.videoMissing")}</Text>
        )}
        {!completed ? (
          <>
            <Text style={styles.hint}>{t("staffTraining.videoHint")}</Text>
            <MarkCompleteButton
              pending={pending}
              onPress={onComplete}
              styles={styles}
              label={t("staffTraining.markComplete")}
              savingLabel={t("staffTraining.saving")}
            />
          </>
        ) : null}
      </View>
    );
  }

  if (section.content_type === "image") {
    return (
      <View style={styles.bodyBlock}>
        {section.video_url ? (
          <Image
            source={{ uri: section.video_url }}
            style={styles.sectionImage}
            contentFit="contain"
          />
        ) : (
          <Text style={styles.muted}>{t("staffTraining.imageMissing")}</Text>
        )}
        {!completed ? (
          <MarkCompleteButton
            pending={pending}
            onPress={onComplete}
            styles={styles}
            label={t("staffTraining.markComplete")}
            savingLabel={t("staffTraining.saving")}
          />
        ) : null}
      </View>
    );
  }

  if (section.content_type === "quiz") {
    const quiz = parseQuiz(rawText || section.content_text);
    if (!quiz) {
      return <Text style={styles.muted}>{t("staffTraining.quizMissing")}</Text>;
    }
    const isCorrect =
      quizSelected !== null && quizSelected === quiz.correct;

    return (
      <View style={styles.bodyBlock}>
        <Text style={styles.quizQuestion}>{quiz.question}</Text>
        {quiz.options.map((opt, i) => {
          const selected = quizSelected === i;
          let borderColor = colors.border;
          let bg = colors.card;
          if (quizSubmitted || completed) {
            if (i === quiz.correct) {
              borderColor = colors.success;
              bg = colors.primarySurface;
            } else if (selected) {
              borderColor = colors.danger;
              bg = colors.bg;
            }
          } else if (selected) {
            borderColor = colors.primary;
            bg = colors.primarySurface;
          }
          return (
            <Pressable
              key={i}
              disabled={quizSubmitted || completed}
              style={[styles.quizOption, { borderColor, backgroundColor: bg }]}
              onPress={() => setQuizSelected(i)}>
              <Text style={[styles.quizOptionText, { color: colors.text }]}>{opt}</Text>
            </Pressable>
          );
        })}
        {!completed && !quizSubmitted ? (
          <Pressable
            style={[styles.primaryBtn, quizSelected === null && styles.disabled]}
            disabled={quizSelected === null}
            onPress={() => {
              setQuizSubmitted(true);
              if (quizSelected === quiz.correct) onComplete();
            }}>
            <Text style={styles.primaryBtnText}>{t("staffTraining.submitAnswer")}</Text>
          </Pressable>
        ) : null}
        {quizSubmitted || completed ? (
          <View style={{ gap: 8 }}>
            <Text
              style={[
                styles.quizResult,
                { color: isCorrect || completed ? colors.success : colors.danger },
              ]}>
              {isCorrect || completed
                ? t("staffTraining.quizCorrect")
                : t("staffTraining.quizIncorrect", {
                    answer: quiz.options[quiz.correct],
                  })}
            </Text>
            {quizSubmitted && !isCorrect && !completed ? (
              <Pressable
                style={styles.outlineBtn}
                onPress={() => {
                  setQuizSubmitted(false);
                  setQuizSelected(null);
                }}>
                <Text style={[styles.outlineBtnText, { color: colors.text }]}>
                  {t("staffTraining.tryAgain")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  // text (default)
  const body = trainingPlainText(rawText);
  return (
    <View style={styles.bodyBlock}>
      <Text style={styles.bodyText}>{body || t("staffTraining.emptySection")}</Text>
      {!completed ? (
        <MarkCompleteButton
          pending={pending}
          onPress={onComplete}
          styles={styles}
          label={t("staffTraining.markComplete")}
          savingLabel={t("staffTraining.saving")}
        />
      ) : null}
    </View>
  );
}

function MarkCompleteButton({
  pending,
  onPress,
  styles,
  label,
  savingLabel,
}: {
  pending: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  label: string;
  savingLabel: string;
}) {
  return (
    <Pressable
      style={[styles.primaryBtn, pending && styles.disabled]}
      disabled={pending}
      onPress={onPress}>
      {pending ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>{pending ? savingLabel : label}</Text>
        </>
      )}
    </Pressable>
  );
}

export default function StaffTrainingPlayerScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ redemptionId: string }>();
  const redemptionId = String(params.redemptionId ?? "");

  const { data: course, isLoading, isError, error, refetch } =
    usePlayerData(redemptionId || null);
  const markComplete = useMarkSectionComplete();

  const [activeSection, setActiveSection] = useState<TrainingSection | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showDone, setShowDone] = useState(false);
  const doneTriggered = useRef(false);

  useEffect(() => {
    if (!course?.chapters?.[0]?.sections?.[0] || activeSection) return;
    setActiveSection(course.chapters[0].sections[0]);
    setExpanded(new Set([course.chapters[0].id]));
  }, [course, activeSection]);

  const completed = useMemo(
    () => new Set(course?.completed_sections ?? []),
    [course?.completed_sections],
  );
  const allSections = useMemo(
    () => course?.chapters.flatMap((c) => c.sections) ?? [],
    [course],
  );
  const total = allSections.length;
  const doneCount = completed.size;
  const courseFinished = total > 0 && doneCount >= total;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  useEffect(() => {
    if (courseFinished && !doneTriggered.current) {
      doneTriggered.current = true;
      const timer = setTimeout(() => setShowDone(true), 600);
      return () => clearTimeout(timer);
    }
  }, [courseFinished]);

  function handleComplete(section: TrainingSection) {
    if (!redemptionId || completed.has(section.id) || markComplete.isPending) return;
    markComplete.mutate(
      { redemptionId, sectionId: section.id },
      {
        onError: (err) => {
          toast.error(
            t("staffTraining.title"),
            err instanceof Error ? err.message : t("staffTraining.progressFailed"),
          );
        },
      },
    );
  }

  function goNext() {
    if (!activeSection || !course) return;
    const idx = allSections.findIndex((s) => s.id === activeSection.id);
    const next = allSections[idx + 1];
    if (!next) return;
    setActiveSection(next);
    const parent = course.chapters.find((c) =>
      c.sections.some((s) => s.id === next.id),
    );
    if (parent) setExpanded((s) => new Set([...s, parent.id]));
  }

  const title = course
    ? trainingLocalized(course.title_i18n, course.title, locale)
    : t("staffTraining.title");

  return (
    <View style={styles.screen}>
      <StaffAppBar
        title={title}
        subtitle={
          course
            ? t("staffTraining.sectionsProgress", { done: doneCount, total })
            : undefined
        }
        displayTitle
      />
      <QueryState
        loading={isLoading && !course}
        error={isError ? (error as Error) : null}
        empty={!isLoading && !course}
        emptyMessage={t("staffTraining.courseNotFound")}
        onRetry={() => void refetch()}>
        {course ? (
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.bg }}
            contentContainerStyle={styles.content}>
            <Pressable
              style={styles.backRow}
              onPress={() => router.replace("/(app)/staff/(tabs)/training" as Href)}>
              <Ionicons name="chevron-back" size={18} color={colors.text} />
              <Text style={styles.backText}>{t("staffTraining.backToList")}</Text>
            </Pressable>

            {course.description ? (
              <Text style={styles.desc}>
                {trainingLocalized(
                  course.description_i18n,
                  course.description,
                  locale,
                )}
              </Text>
            ) : null}

            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${pct}%`,
                      backgroundColor: courseFinished
                        ? colors.success
                        : colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            {courseFinished ? (
              <View style={styles.completeBanner}>
                <Ionicons name="trophy-outline" size={20} color={colors.success} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.completeTitle}>
                    {t("staffTraining.courseComplete")}
                  </Text>
                  <Text style={styles.completeBody}>
                    {t("staffTraining.courseCompleteBody")}
                  </Text>
                </View>
              </View>
            ) : null}

            {course.chapters.map((chapter) => {
              const chapterDone = chapter.sections.every((s) =>
                completed.has(s.id),
              );
              const isOpen = expanded.has(chapter.id);
              return (
                <View key={chapter.id} style={styles.chapter}>
                  <Pressable
                    style={styles.chapterHeader}
                    onPress={() =>
                      setExpanded((s) => {
                        const n = new Set(s);
                        if (n.has(chapter.id)) n.delete(chapter.id);
                        else n.add(chapter.id);
                        return n;
                      })
                    }>
                    <Ionicons
                      name={isOpen ? "chevron-down" : "chevron-forward"}
                      size={16}
                      color={colors.textMuted}
                    />
                    <Text style={styles.chapterTitle} numberOfLines={2}>
                      {trainingLocalized(chapter.title_i18n, chapter.title, locale)}
                    </Text>
                    {chapterDone ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.success}
                      />
                    ) : null}
                  </Pressable>
                  {isOpen
                    ? chapter.sections.map((section) => {
                        const isActive = activeSection?.id === section.id;
                        const isDone = completed.has(section.id);
                        return (
                          <Pressable
                            key={section.id}
                            style={[
                              styles.sectionRow,
                              isActive && styles.sectionRowActive,
                            ]}
                            onPress={() => setActiveSection(section)}>
                            <Ionicons
                              name={
                                isDone
                                  ? "checkmark-circle"
                                  : contentIcon(section.content_type)
                              }
                              size={16}
                              color={
                                isDone
                                  ? colors.success
                                  : isActive
                                    ? colors.primary
                                    : colors.textMuted
                              }
                            />
                            <Text
                              style={[
                                styles.sectionRowText,
                                isActive && { color: colors.primary },
                              ]}
                              numberOfLines={1}>
                              {trainingLocalized(
                                section.title_i18n,
                                section.title,
                                locale,
                              )}
                            </Text>
                          </Pressable>
                        );
                      })
                    : null}
                </View>
              );
            })}

            {activeSection ? (
              <View style={styles.viewer}>
                <View style={styles.viewerHeader}>
                  <Ionicons
                    name={
                      completed.has(activeSection.id)
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={18}
                    color={
                      completed.has(activeSection.id)
                        ? colors.success
                        : colors.textMuted
                    }
                  />
                  <Text style={styles.viewerTitle}>
                    {trainingLocalized(
                      activeSection.title_i18n,
                      activeSection.title,
                      locale,
                    )}
                  </Text>
                </View>
                <SectionBody
                  section={activeSection}
                  completed={completed.has(activeSection.id)}
                  pending={markComplete.isPending}
                  locale={locale}
                  onComplete={() => handleComplete(activeSection)}
                  styles={styles}
                  colors={colors}
                />
                {(() => {
                  const idx = allSections.findIndex(
                    (s) => s.id === activeSection.id,
                  );
                  if (idx < 0 || idx >= allSections.length - 1) return null;
                  return (
                    <Pressable style={styles.outlineBtn} onPress={goNext}>
                      <Text style={[styles.outlineBtnText, { color: colors.text }]}>
                        {t("staffTraining.nextSection")}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.text}
                      />
                    </Pressable>
                  );
                })()}
              </View>
            ) : (
              <Text style={styles.muted}>{t("staffTraining.selectSection")}</Text>
            )}
          </ScrollView>
        ) : null}
      </QueryState>

      <Modal
        visible={showDone}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDone(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Ionicons name="trophy" size={36} color={colors.success} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("staffTraining.courseComplete")}
            </Text>
            <Text style={[styles.modalBody, { color: colors.textMuted }]}>
              {t("staffTraining.courseCompleteBody")}
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                setShowDone(false);
                router.replace("/(app)/staff/(tabs)/training" as Href);
              }}>
              <Text style={styles.primaryBtnText}>
                {t("staffTraining.backToList")}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowDone(false)}>
              <Text style={[styles.skipText, { color: colors.textMuted }]}>
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 48, gap: 12 },
    backRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      marginBottom: 4,
    },
    backText: {
      fontSize: 13,
      color: colors.text,
      fontFamily: ownerFonts.medium,
    },
    desc: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
      lineHeight: 18,
    },
    progressWrap: { marginBottom: 4 },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 3 },
    completeBanner: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.success,
      backgroundColor: colors.primarySurface,
    },
    completeTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.success,
      fontFamily: ownerFonts.bold,
    },
    completeBody: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: ownerFonts.regular,
    },
    chapter: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.card,
    },
    chapterHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    chapterTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    sectionRowActive: { backgroundColor: colors.primarySurface },
    sectionRowText: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
      fontFamily: ownerFonts.regular,
    },
    viewer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      backgroundColor: colors.card,
      gap: 14,
      marginTop: 4,
    },
    viewerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    viewerTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      fontFamily: ownerFonts.bold,
    },
    bodyBlock: { gap: 12 },
    bodyText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.text,
      fontFamily: ownerFonts.regular,
    },
    muted: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: ownerFonts.regular,
    },
    hint: {
      fontSize: 11,
      color: colors.textDim,
      textAlign: "center",
      fontFamily: ownerFonts.regular,
    },
    videoCard: {
      height: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    videoCardText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
      fontFamily: ownerFonts.semiBold,
    },
    sectionImage: {
      width: "100%",
      height: 220,
      borderRadius: 12,
      backgroundColor: colors.bg,
    },
    quizQuestion: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      fontFamily: ownerFonts.semiBold,
    },
    quizOption: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 12,
    },
    quizOptionText: {
      fontSize: 13,
      fontFamily: ownerFonts.regular,
    },
    quizResult: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    primaryBtn: {
      height: 42,
      borderRadius: 10,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 14,
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      fontFamily: ownerFonts.semiBold,
    },
    outlineBtn: {
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingHorizontal: 12,
    },
    outlineBtnText: {
      fontSize: 13,
      fontFamily: ownerFonts.medium,
    },
    disabled: { opacity: 0.55 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 340,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      gap: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      fontFamily: ownerFonts.bold,
      textAlign: "center",
    },
    modalBody: {
      fontSize: 13,
      textAlign: "center",
      fontFamily: ownerFonts.regular,
      marginBottom: 4,
    },
    skipText: {
      fontSize: 13,
      marginTop: 4,
      fontFamily: ownerFonts.regular,
    },
  });
}
