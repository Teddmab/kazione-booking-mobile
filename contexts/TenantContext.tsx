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
  role: MemberRole;
  staffProfileId: string | null;
  position: string | null;
}

/** Raw GET /me body (Edge Function). */
interface MeApiResponse {
  tenant?: TenantContextValue | null;
  businesses?: TenantContextValue[];
}

/** Normalised workspace list for the provider. */
interface TenantBootstrap {
  tenant: TenantContextValue | null;
  businesses: TenantContextValue[];
}

interface TenantState {
  tenant: TenantContextValue | null;
  businesses: TenantContextValue[];
  setActiveBusiness: (businessId: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const STORAGE_KEY = "kazione_active_business_id";

/** Shared with login-team prefetch and TanStack Query. */
export async function fetchTenantBootstrap(): Promise<TenantBootstrap> {
  const result = await api.get<MeApiResponse>("/me");
  const rawBusinesses = result.businesses?.length ? result.businesses : null;
  const single = result.tenant ?? null;
  const businesses = rawBusinesses ?? (single ? [single] : []);
  return {
    tenant: single,
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

  const resolveActive = useCallback(
    (storedId: string | null): TenantContextValue | null => {
      if (!businesses.length) return null;
      const match = storedId
        ? businesses.find((b) => b.businessId === storedId)
        : undefined;
      return match ?? businesses[0];
    },
    [businesses],
  );

  const [overrideId, setOverrideId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (!cancelled) setOverrideId(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tenant = useMemo(() => resolveActive(overrideId), [resolveActive, overrideId]);

  const setActiveBusiness = useCallback(async (businessId: string) => {
    await AsyncStorage.setItem(STORAGE_KEY, businessId);
    setOverrideId(businessId);
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        businesses,
        setActiveBusiness,
        loading: !!(user?.id && isPending),
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
