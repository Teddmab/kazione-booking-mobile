import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type StaffTabIcon = ComponentProps<typeof Ionicons>["name"];

export type StaffTabRoute = {
  name: string;
  titleKey: string;
  icon: StaffTabIcon;
  iconFocused: StaffTabIcon;
};

/** Bottom tabs — profile lives in the sidebar */
export const STAFF_BOTTOM_TABS: StaffTabRoute[] = [
  {
    name: "today",
    titleKey: "staffNav.today",
    icon: "grid-outline",
    iconFocused: "grid",
  },
  {
    name: "calendar",
    titleKey: "staffNav.calendar",
    icon: "calendar-outline",
    iconFocused: "calendar",
  },
  {
    name: "services",
    titleKey: "sidebar.services",
    icon: "cut-outline",
    iconFocused: "cut",
  },
  {
    name: "performance",
    titleKey: "staffNav.performance",
    icon: "bar-chart-outline",
    iconFocused: "bar-chart",
  },
];
