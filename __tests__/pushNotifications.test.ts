import {
  parseStaffPushData,
  staffHrefForPushData,
} from "@/lib/pushRouting";

describe("staffHrefForPushData", () => {
  it("routes service offers to services", () => {
    expect(
      staffHrefForPushData(parseStaffPushData({ type: "service_offer" })),
    ).toBe("/(app)/staff/(tabs)/services");
  });

  it("routes appointment payloads to calendar", () => {
    expect(
      staffHrefForPushData(
        parseStaffPushData({
          type: "new_booking",
          appointment_id: "a1",
        }),
      ),
    ).toBe("/(app)/staff/(tabs)/calendar");
  });

  it("defaults to notifications list", () => {
    expect(staffHrefForPushData(parseStaffPushData({ type: "other" }))).toBe(
      "/(app)/staff/(tabs)/notifications",
    );
  });
});

describe("parseStaffPushData", () => {
  it("ignores non-string fields", () => {
    expect(
      parseStaffPushData({ type: 1, appointment_id: null } as Record<
        string,
        unknown
      >),
    ).toEqual({});
  });
});
