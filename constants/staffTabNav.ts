import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type StaffTabIcon = ComponentProps<typeof Ionicons>["name"];

export type StaffTabRoute = {
  name: string;
  titleKey: string;
  icon: StaffTabIcon;
  iconFocused: StaffTabIcon;
};

/** Bottom tabs — everything else lives under More */
export const STAFF_BOTTOM_TABS: StaffTabRoute[] = [
  {
    name: "today",
    titleKey: "staffNav.today",
    icon: "sunny-outline",
    iconFocused: "sunny",
  },
  {
    name: "calendar",
    titleKey: "staffNav.appointments",
    icon: "calendar-outline",
    iconFocused: "calendar",
  },
  {
    name: "services",
    titleKey: "staffNav.services",
    icon: "cut-outline",
    iconFocused: "cut",
  },
  {
    name: "reviews",
    titleKey: "staffNav.reviews",
    icon: "star-outline",
    iconFocused: "star",
  },
  {
    name: "more",
    titleKey: "staffNav.more",
    icon: "ellipsis-horizontal",
    iconFocused: "ellipsis-horizontal",
  },
];
