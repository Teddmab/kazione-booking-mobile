import type { TFunction } from "i18next";

export type StaffClientStatus = "Frequent" | "Returning" | "New";

/** Match web StaffClientsPage getClientStatus */
export function getStaffClientStatus(
  appointmentCount: number,
): StaffClientStatus {
  if (appointmentCount >= 6) return "Frequent";
  if (appointmentCount >= 2) return "Returning";
  return "New";
}

/** Days since last visit (calendar). null if never visited. */
export function daysSinceVisit(lastVisit: string | null): number | null {
  if (!lastVisit) return null;
  const date = new Date(lastVisit);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startVisit = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return Math.max(
    0,
    Math.floor((startToday.getTime() - startVisit.getTime()) / 86_400_000),
  );
}

/**
 * Follow-up recommended when the client has no upcoming appointment and
 * hasn't visited for FOLLOW_UP_AFTER_DAYS.
 */
export const FOLLOW_UP_AFTER_DAYS = 21;

export function needsFollowUp(opts: {
  lastVisit: string | null;
  hasUpcoming: boolean;
  appointmentCount: number;
}): boolean {
  if (opts.hasUpcoming) return false;
  if (opts.appointmentCount <= 0) return false;
  const days = daysSinceVisit(opts.lastVisit);
  if (days == null) return false;
  return days >= FOLLOW_UP_AFTER_DAYS;
}

export function formatRelativeVisit(
  dateString: string | null,
  t: TFunction,
): string {
  if (!dateString) return t("staffClientsPage.never");
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) {
    return t("staffClientsPage.relativeMinutes", { count: Math.max(minutes, 0) });
  }
  if (hours < 24) {
    return t("staffClientsPage.relativeHours", { count: hours });
  }
  if (days === 1) return t("staffClientsPage.yesterday");
  if (days < 7) return t("staffClientsPage.relativeDays", { count: days });
  if (days < 30) {
    return t("staffClientsPage.relativeWeeks", { count: Math.floor(days / 7) });
  }
  return t("staffClientsPage.relativeMonths", {
    count: Math.floor(days / 30),
  });
}
