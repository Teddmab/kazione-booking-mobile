import type { OwnerServiceRow } from "@/types/owner";

export interface ServiceSection {
  title: string;
  data: OwnerServiceRow[];
}

/** Groups services by category_name; uncategorized last. */
export function groupServicesByCategory(services: OwnerServiceRow[]): ServiceSection[] {
  const map = new Map<string, OwnerServiceRow[]>();

  for (const s of services) {
    const key = s.category_name?.trim() || "Sans catégorie";
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }

  const entries = [...map.entries()].sort(([a], [b]) => {
    if (a === "Sans catégorie") return 1;
    if (b === "Sans catégorie") return -1;
    return a.localeCompare(b, "fr");
  });

  return entries.map(([title, data]) => ({ title, data }));
}

export function extractCategoryNames(services: OwnerServiceRow[]): string[] {
  const set = new Set<string>();
  for (const s of services) {
    const n = s.category_name?.trim();
    if (n) set.add(n);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
}
