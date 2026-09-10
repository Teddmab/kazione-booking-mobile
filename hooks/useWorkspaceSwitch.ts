import { useCallback } from "react";

import { useTenantContext } from "@/contexts/TenantContext";
import { useWorkspaceSwitchSheet } from "@/contexts/WorkspaceSwitchContext";
import {
  isOwnerMembership,
  isStaffMembership,
} from "@/lib/workspaceRouting";

/**
 * Opens the workspace switch bottom sheet (Staff ↔ Owner / multi-salon).
 */
export function useWorkspaceSwitch() {
  const { businesses, tenant } = useTenantContext();
  const { openSwitch } = useWorkspaceSwitchSheet();

  const canSwitch = businesses.length > 1;

  const hasOwnerPortal = businesses.some((b) => isOwnerMembership(b.role));
  const hasStaffPortal = businesses.some((b) => isStaffMembership(b.role));
  const crossPortal =
    !!tenant &&
    ((isStaffMembership(tenant.role) && hasOwnerPortal) ||
      (isOwnerMembership(tenant.role) && hasStaffPortal));

  const switchWorkspace = useCallback(() => {
    if (!canSwitch) return;
    openSwitch();
  }, [canSwitch, openSwitch]);

  return { canSwitch, crossPortal, switchWorkspace };
}
