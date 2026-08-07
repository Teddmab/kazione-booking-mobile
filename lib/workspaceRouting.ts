import type { MemberRole, TenantContextValue } from "@/contexts/TenantContext";

export type WorkspaceRoute = "/(app)/staff/(tabs)/today";

/** Mobile app is staff-only — owner / manager / receptionist use the web app. */
export function isStaffMembership(role: MemberRole): boolean {
  return role === "staff";
}

export function workspaceRouteForMembership(
  _role: MemberRole,
): WorkspaceRoute {
  return "/(app)/staff/(tabs)/today";
}

export function workspaceRouteForTenant(
  _tenant: TenantContextValue,
): WorkspaceRoute {
  return "/(app)/staff/(tabs)/today";
}

export function roleLabel(role: MemberRole, position?: string | null): string {
  const roleName =
    role === "owner"
      ? "Owner"
      : role === "manager"
        ? "Manager"
        : role === "receptionist"
          ? "Reception"
          : "Staff";
  if (position?.trim()) return `${position.trim()} · ${roleName}`;
  return roleName;
}
