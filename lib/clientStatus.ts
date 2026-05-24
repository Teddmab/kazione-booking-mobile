export type ClientStatusFilter = "all" | "vip" | "active" | "new" | "at_risk" | "inactive";

export type ClientStatus = "VIP" | "Active" | "New" | "At risk" | "Inactive";

function statusFromLastVisit(lastVisit: string | null): ClientStatus | null {
  if (!lastVisit) return null;
  const daysSince = Math.floor((Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince > 90) return "Inactive";
  if (daysSince > 30) return "At risk";
  return null;
}

export function getClientStatus(appointmentCount: number, lastVisit: string | null): ClientStatus {
  if (appointmentCount <= 1) return "New";
  if (appointmentCount >= 10) return "VIP";
  return statusFromLastVisit(lastVisit) ?? "Active";
}

export function matchesClientFilter(status: ClientStatus, filter: ClientStatusFilter): boolean {
  if (filter === "all") return true;
  const map: Record<Exclude<ClientStatusFilter, "all">, ClientStatus> = {
    vip: "VIP",
    active: "Active",
    new: "New",
    at_risk: "At risk",
    inactive: "Inactive",
  };
  return status === map[filter];
}

export function computeClientKPIs(
  clients: { appointment_count: number; last_visit: string | null }[],
  total: number,
) {
  let vip = 0;
  let active = 0;
  let newCount = 0;
  let atRisk = 0;

  for (const c of clients) {
    const s = getClientStatus(c.appointment_count, c.last_visit);
    if (s === "VIP") vip++;
    else if (s === "Active") active++;
    else if (s === "New") newCount++;
    else if (s === "At risk") atRisk++;
  }

  return { total, new: newCount, active, vip, atRisk };
}
