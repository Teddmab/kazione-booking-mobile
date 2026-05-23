import { dateRangeForPeriod, formatChartLabel } from "@/lib/financePeriod";

describe("financePeriod", () => {
  it("returns same day for today period", () => {
    const today = new Date().toISOString().slice(0, 10);
    const range = dateRangeForPeriod("today");
    expect(range.from).toBe(today);
    expect(range.to).toBe(today);
  });

  it("formats chart labels", () => {
    expect(formatChartLabel("2026-05-19", "en")).toMatch(/19/);
  });
});
