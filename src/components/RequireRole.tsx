import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoles, AppRole } from "@/hooks/useRoles";

export function RequireRole({ roles }: { roles: AppRole[] }) {
  const { user, loading: aLoad } = useAuth();
  const { roles: my, loading: rLoad } = useRoles();
  if (aLoad || rLoad) return <div className="container-page py-20 text-center text-muted-foreground">Yuklanmoqda…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!roles.some((r) => my.includes(r))) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-semibold">Ruxsat yo'q</h1>
        <p className="text-muted-foreground mt-2">Bu sahifaga kirish uchun sizda kerakli huquq mavjud emas.</p>
      </div>
    );
  }
  return <Outlet />;
}