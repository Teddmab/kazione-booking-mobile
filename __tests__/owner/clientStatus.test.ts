import { computeClientKPIs, getClientStatus, matchesClientFilter } from "@/lib/clientStatus";

describe("clientStatus", () => {
  it("classifies VIP clients", () => {
    expect(getClientStatus(10, "2026-01-01")).toBe("VIP");
  });

  it("classifies new clients", () => {
    expect(getClientStatus(1, null)).toBe("New");
  });

  it("filters by status", () => {
    expect(matchesClientFilter("VIP", "vip")).toBe(true);
    expect(matchesClientFilter("Active", "vip")).toBe(false);
  });

  it("computes KPI totals", () => {
    const kpis = computeClientKPIs(
      [
        { appointment_count: 12, last_visit: "2026-01-01" },
        { appointment_count: 1, last_visit: null },
      ],
      2,
    );
    expect(kpis.total).toBe(2);
    expect(kpis.vip).toBe(1);
    expect(kpis.new).toBe(1);
  });
});
