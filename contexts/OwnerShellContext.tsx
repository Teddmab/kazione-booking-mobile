import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface OwnerShellContextValue {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const OwnerShellContext = createContext<OwnerShellContextValue | undefined>(undefined);

export function OwnerShellProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  const value = useMemo(
    () => ({ drawerOpen, openDrawer, closeDrawer, toggleDrawer }),
    [drawerOpen, openDrawer, closeDrawer, toggleDrawer],
  );

  return <OwnerShellContext.Provider value={value}>{children}</OwnerShellContext.Provider>;
}

export function useOwnerShell() {
  const ctx = useContext(OwnerShellContext);
  if (!ctx) throw new Error("useOwnerShell must be used within OwnerShellProvider");
  return ctx;
}
