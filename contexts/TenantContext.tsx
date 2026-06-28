import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuthContext } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export type MemberRole = "owner" | "manager" | "staff" | "receptionist";

export interface TenantContextValue {
  businessId: string;
  businessName: string;
  slug: string;
  businessType: string | null;
  role: MemberRole;
  position: string | null;
  staffProfileId: string | null;
  commissionRate: number;
}

/** Raw GET /me business row (Edge Function). */
interface MeBusinessRow {
  businessId: string;
  businessName: string;
  slug?: string;
  businessType?: string | null;
  role: string;
  position?: string | null;
  staffProfileId?: string | null;
  commissionRate?: number | null;
}

/** Raw GET /me body (Edge Function). */
interface MeApiResponse {
  tenant?: MeBusinessRow | null;
  businesses?: MeBusinessRow[];
}

/** Normalised workspace list for the provider. */
interface TenantBootstrap {
  tenant: TenantContextValue | null;
  businesses: TenantContextValue[];
}

interface TenantState {
  tenant: TenantContextValue | null;
  businesses: TenantContextValue[];
  needsRoleSelection: boolean;
  selectMembership: (membership: TenantContextValue) => Promise<void>;
  setActiveBusiness: (businessId: string) => Promise<void>;
  clearActiveBusiness: () => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const STORAGE_KEY = "kazione_active_business_id";

function normalizeRole(role: string): MemberRole {
  if (role === "owner" || role === "manager" || role === "staff" || role === "receptionist") {
    return role;
  }
  return "staff";
}

function normalizeMembership(row: MeBusinessRow): TenantContextValue {
  return {
    businessId: row.businessId,
    businessName: row.businessName,
    slug: row.slug ?? "",
    businessType: row.businessType ?? null,
    role: normalizeRole(row.role),
    position: row.position ?? null,
    staffProfileId: row.staffProfileId ?? null,
    commissionRate: row.commissionRate ?? 0,
  };
}

/** Shared with login-team prefetch and TanStack Query. */
export async function fetchTenantBootstrap(): Promise<TenantBootstrap> {
  const result = await api.get<MeApiResponse>("/me");
  const rawBusinesses = result.businesses?.length ? result.businesses : null;
  const single = result.tenant ?? null;
  const rows = rawBusinesses ?? (single ? [single] : []);
  const businesses = rows.map(normalizeMembership);
  return {
    tenant: businesses[0] ?? null,
    businesses,
  };
}

export function tenantQueryKey(userId: string | undefined) {
  return ["tenant", userId] as const;
}

const TenantContext = createContext<TenantState | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();

  const { data, error, isPending } = useQuery<TenantBootstrap>({
    queryKey: tenantQueryKey(user?.id),
    queryFn: fetchTenantBootstrap,
    enabled: !!user?.id,
    staleTime: 300_000,
    retry: 2,
    retryDelay: (attempt) => 250 * (attempt + 1),
  });

  const businesses = useMemo(() => data?.businesses ?? [], [data]);

  const [storedId, setStoredId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (!cancelled) setStoredId(v);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const resolveActive = useCallback(
    (activeId: string | null | undefined): TenantContextValue | null => {
      if (!businesses.length) return null;
      if (businesses.length === 1) return businesses[0];
      if (!activeId) return null;
      return businesses.find((b) => b.businessId === activeId) ?? null;
    },
    [businesses],
  );

  const tenant = useMemo(() => {
    if (storedId === undefined) return null;
    return resolveActive(storedId);
  }, [resolveActive, storedId]);

  const needsRoleSelection = useMemo(() => {
    if (storedId === undefined) return false;
    return businesses.length > 1 && tenant === null;
  }, [businesses.length, storedId, tenant]);

  const selectMembership = useCallback(async (membership: TenantContextValue) => {
    await AsyncStorage.setItem(STORAGE_KEY, membership.businessId);
    setStoredId(membership.businessId);
  }, []);

  const setActiveBusiness = useCallback(
    async (businessId: string) => {
      const match = businesses.find((b) => b.businessId === businessId);
      if (!match) return;
      await selectMembership(match);
    },
    [businesses, selectMembership],
  );

  const clearActiveBusiness = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setStoredId(null);
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        businesses,
        needsRoleSelection,
        selectMembership,
        setActiveBusiness,
        clearActiveBusiness,
        loading: !!(user?.id && (isPending || storedId === undefined)),
        error: error as Error | null,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenantContext must be used within TenantProvider");
  return ctx;
}
