import type { AppointmentWithRelations } from "@/types/owner";

export type AppointmentFlag = "test" | "duplicate" | "close_interval";

export function computeAppointmentFlags(
  appointments: AppointmentWithRelations[],
): Map<string, AppointmentFlag> {
  const map = new Map<string, AppointmentFlag>();

  for (const a of appointments) {
    const name = `${a.client.first_name} ${a.client.last_name}`.toLowerCase();
    const notes = a.notes ?? "";
    if (name.includes("test") || notes.toLowerCase().includes("test")) {
      map.set(a.id, "test");
    }
  }

  const byClient = new Map<string, AppointmentWithRelations[]>();
  for (const a of appointments) {
    if (map.has(a.id)) continue;
    if (!byClient.has(a.client_id)) byClient.set(a.client_id, []);
    byClient.get(a.client_id)!.push(a);
  }

  for (const [, clientAppts] of byClient) {
    const sorted = [...clientAppts]
      .filter((a) => a.status !== "cancelled" && a.status !== "no_show")
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const daysDiff =
        (new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()) /
        (1000 * 60 * 60 * 24);

      if (a.service_id === b.service_id && daysDiff <= 7) {
        if (!map.has(a.id)) map.set(a.id, "duplicate");
        if (!map.has(b.id)) map.set(b.id, "duplicate");
      } else if (
        daysDiff <= 3 &&
        (a.duration_minutes >= 180 || b.duration_minutes >= 180)
      ) {
        if (!map.has(a.id)) map.set(a.id, "close_interval");
        if (!map.has(b.id)) map.set(b.id, "close_interval");
      }
    }
  }

  return map;
}

export function flagLabel(flag: AppointmentFlag): string {
  switch (flag) {
    case "test":
      return "Test";
    case "duplicate":
      return "Doublon";
    case "close_interval":
      return "Intervalle court";
  }
}

export function flagBorderColor(flag: AppointmentFlag): string {
  switch (flag) {
    case "duplicate":
      return "#F59E0B";
    case "close_interval":
      return "#F97316";
    default:
      return "transparent";
  }
}
