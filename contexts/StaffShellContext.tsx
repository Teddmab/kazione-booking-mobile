import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface StaffShellContextValue {
  moreOpen: boolean;
  openMore: () => void;
  closeMore: () => void;
  toggleMore: () => void;
}

const StaffShellContext = createContext<StaffShellContextValue | undefined>(undefined);

export function StaffShellProvider({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);

  const openMore = useCallback(() => setMoreOpen(true), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const toggleMore = useCallback(() => setMoreOpen((v) => !v), []);

  const value = useMemo(
    () => ({ moreOpen, openMore, closeMore, toggleMore }),
    [moreOpen, openMore, closeMore, toggleMore],
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
