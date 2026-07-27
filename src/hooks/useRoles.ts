import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "./useAuth";

export type AppRole = "student" | "teacher" | "librarian" | "vice_principal" | "admin" | "superadmin";

export function useRoles() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my_roles", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AppRole[]> => {
      return api.roles as AppRole[];
    },
    staleTime: 60_000,
  });
  const roles = q.data ?? [];
  return {
    roles,
    loading: q.isLoading,
    has: (r: AppRole) => roles.includes(r),
    hasAny: (...r: AppRole[]) => r.some((x) => roles.includes(x)),
    isAdmin: roles.includes("admin") || roles.includes("superadmin"),
    isSuper: roles.includes("superadmin"),
    canEditSchedule: ["admin", "superadmin", "vice_principal"].some((r) => roles.includes(r as AppRole)),
  };
}
