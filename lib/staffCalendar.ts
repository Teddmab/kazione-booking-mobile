export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 22;
export const GRID_HOURS = GRID_END_HOUR - GRID_START_HOUR;
export const HOUR_PX = 64;
export const TOTAL_PX = GRID_HOURS * HOUR_PX;
export const TIME_COL_W = 48;

export function minutesFromGridStart(iso: string): number {
  const d = new Date(iso);
  // Wall-clock salon time is stored as UTC — use UTC parts for grid placement.
  return d.getUTCHours() * 60 + d.getUTCMinutes() - GRID_START_HOUR * 60;
}

export function apptTopPx(iso: string): number {
  return Math.max(0, (minutesFromGridStart(iso) / 60) * HOUR_PX);
}

export function apptHeightPx(startsAt: string, endsAt: string): number {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const mins = Math.max(15, (end - start) / 60_000);
  return Math.max(18, (mins / 60) * HOUR_PX);
}

export interface OverlapLayout {
  id: string;
  colOffset: number;
  colCount: number;
}

/** Greedy column packing for overlapping appointments. */
export function resolveOverlaps(
  items: { id: string; starts_at: string; ends_at: string }[],
): Map<string, OverlapLayout> {
  const sorted = [...items].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  type Active = { id: string; ends: number; col: number };
  const active: Active[] = [];
  const colById = new Map<string, number>();
  const result = new Map<string, OverlapLayout>();

  let clusterIds: string[] = [];
  let clusterMaxCol = 0;

  const flushCluster = () => {
    const colCount = Math.max(1, clusterMaxCol + 1);
    for (const id of clusterIds) {
      result.set(id, {
        id,
        colOffset: colById.get(id) ?? 0,
        colCount,
      });
    }
    clusterIds = [];
    clusterMaxCol = 0;
  };

  for (const item of sorted) {
    const start = new Date(item.starts_at).getTime();
    const ends = new Date(item.ends_at).getTime();

    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].ends <= start) active.splice(i, 1);
    }

    if (active.length === 0 && clusterIds.length > 0) {
      flushCluster();
    }

    const used = new Set(active.map((a) => a.col));
    let col = 0;
    while (used.has(col)) col += 1;

    active.push({ id: item.id, ends, col });
    colById.set(item.id, col);
    clusterIds.push(item.id);
    clusterMaxCol = Math.max(clusterMaxCol, col);
  }

  if (clusterIds.length > 0) flushCluster();
  return result;
}

export function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const fmt = (d: Date, withYear = false) =>
    d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" as const } : {}),
    });
  return `${fmt(weekStart)} – ${fmt(weekEnd, true)}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
