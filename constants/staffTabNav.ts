import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type StaffTabIcon = ComponentProps<typeof Ionicons>["name"];

export type StaffTabRoute = {
  name: string;
  title: string;
  icon: StaffTabIcon;
  iconFocused: StaffTabIcon;
};

export const STAFF_BOTTOM_TABS: StaffTabRoute[] = [
  {
    name: "today",
    title: "Aujourd'hui",
    icon: "today-outline",
    iconFocused: "today",
  },
  {
    name: "calendar",
    title: "Agenda",
    icon: "calendar-outline",
    iconFocused: "calendar",
  },
  {
    name: "history",
    title: "Historique",
    icon: "time-outline",
    iconFocused: "time",
  },
  {
    name: "profile",
    title: "Profil",
    icon: "person-outline",
    iconFocused: "person",
  },
];
