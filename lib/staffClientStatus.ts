export type StaffClientStatus = "Frequent" | "Returning" | "New";

/** Match web StaffClientsPage getClientStatus */
export function getStaffClientStatus(
  appointmentCount: number,
): StaffClientStatus {
  if (appointmentCount >= 6) return "Frequent";
  if (appointmentCount >= 2) return "Returning";
  return "New";
}

export function formatRelativeVisit(dateString: string | null): string {
  if (!dateString) return "Jamais";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${Math.max(minutes, 0)} min`;
  if (hours < 24) return `${hours} h`;
  if (days === 1) return "Hier";
  if (days < 7) return `${days} j`;
  if (days < 30) return `${Math.floor(days / 7)} sem`;
  return `${Math.floor(days / 30)} mois`;
}
