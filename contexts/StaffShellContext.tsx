import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface StaffShellContextValue {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const StaffShellContext = createContext<StaffShellContextValue | undefined>(undefined);

export function StaffShellProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  const value = useMemo(
    () => ({ drawerOpen, openDrawer, closeDrawer, toggleDrawer }),
    [drawerOpen, openDrawer, closeDrawer, toggleDrawer],
  );

  return (
    <StaffShellContext.Provider value={value}>{children}</StaffShellContext.Provider>
  );
}

export function useStaffShell() {
  const ctx = useContext(StaffShellContext);
  if (!ctx) throw new Error("useStaffShell must be used within StaffShellProvider");
  return ctx;
}
