import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface WorkspaceSwitchContextValue {
  open: boolean;
  openSwitch: () => void;
  closeSwitch: () => void;
}

const WorkspaceSwitchContext = createContext<
  WorkspaceSwitchContextValue | undefined
>(undefined);

export function WorkspaceSwitchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSwitch = useCallback(() => setOpen(true), []);
  const closeSwitch = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openSwitch, closeSwitch }),
    [open, openSwitch, closeSwitch],
  );

  return (
    <WorkspaceSwitchContext.Provider value={value}>
      {children}
    </WorkspaceSwitchContext.Provider>
  );
}

export function useWorkspaceSwitchSheet() {
  const ctx = useContext(WorkspaceSwitchContext);
  if (!ctx) {
    throw new Error(
      "useWorkspaceSwitchSheet must be used within WorkspaceSwitchProvider",
    );
  }
  return ctx;
}
