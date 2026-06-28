import type { MemberRole, TenantContextValue } from "@/contexts/TenantContext";

export type WorkspaceRoute =
  | "/(app)/owner/(tabs)"
  | "/(staff)"
  | "/(app)/receptionist/home";

export function workspaceRouteForMembership(
  role: MemberRole,
): WorkspaceRoute {
  if (role === "owner" || role === "manager") return "/(app)/owner/(tabs)";
  if (role === "receptionist") return "/(app)/receptionist/home";
  return "/(staff)";
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
