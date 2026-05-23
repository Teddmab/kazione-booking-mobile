import {
  extractCategoryNames,
  groupServicesByCategory,
} from "@/lib/groupServicesByCategory";
import type { OwnerServiceRow } from "@/types/owner";

function svc(
  id: string,
  name: string,
  category: string | null,
): OwnerServiceRow {
  return {
    id,
    name,
    description: null,
    duration_minutes: 60,
    price: 50,
    currency_code: "EUR",
    is_active: true,
    category_name: category,
  };
}

describe("groupServicesByCategory", () => {
  it("groups by category with section titles", () => {
    const sections = groupServicesByCategory([
      svc("1", "A", "Tresses"),
      svc("2", "B", "Tresses"),
      svc("3", "C", null),
    ]);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe("Tresses");
    expect(sections[0].data).toHaveLength(2);
    expect(sections[1].title).toBe("Sans catégorie");
  });

  it("extractCategoryNames returns sorted unique names", () => {
    const names = extractCategoryNames([
      svc("1", "A", "Zebra"),
      svc("2", "B", "Alpha"),
      svc("3", "C", "Alpha"),
    ]);
    expect(names).toEqual(["Alpha", "Zebra"]);
  });
});
