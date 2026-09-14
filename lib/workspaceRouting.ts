import type { MemberRole, TenantContextValue } from "@/contexts/TenantContext";

export type WorkspaceRoute =
  | "/(app)/owner/(tabs)"
  | "/(app)/staff/(tabs)/today"
  | "/(app)/receptionist/home";

/** Roles allowed to use the mobile app (not client marketplace). */
export function isPortalMembership(role: MemberRole): boolean {
  return (
    role === "owner" ||
    role === "manager" ||
    role === "staff" ||
    role === "receptionist"
  );
}

export function isStaffMembership(role: MemberRole): boolean {
  return role === "staff";
}

export function isOwnerMembership(role: MemberRole): boolean {
  return role === "owner" || role === "manager";
}

export function workspaceRouteForMembership(
  role: MemberRole,
): WorkspaceRoute {
  if (role === "owner" || role === "manager") return "/(app)/owner/(tabs)";
  if (role === "receptionist") return "/(app)/receptionist/home";
  return "/(app)/staff/(tabs)/today";
}

export function workspaceRouteForTenant(
  tenant: TenantContextValue,
): WorkspaceRoute {
  return workspaceRouteForMembership(tenant.role);
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
