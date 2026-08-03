import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type StaffTabIcon = ComponentProps<typeof Ionicons>["name"];

export type StaffTabRoute = {
  name: string;
  title: string;
  icon: StaffTabIcon;
  iconFocused: StaffTabIcon;
};

/** Bottom tabs — profile lives in the sidebar */
export const STAFF_BOTTOM_TABS: StaffTabRoute[] = [
  {
    name: "today",
    title: "Aujourd'hui",
    icon: "grid-outline",
    iconFocused: "grid",
  },
  {
    name: "calendar",
    title: "Agenda",
    icon: "calendar-outline",
    iconFocused: "calendar",
  },
  {
    name: "services",
    title: "Services",
    icon: "cut-outline",
    iconFocused: "cut",
  },
  {
    name: "performance",
    title: "Perf.",
    icon: "bar-chart-outline",
    iconFocused: "bar-chart",
  },
];
