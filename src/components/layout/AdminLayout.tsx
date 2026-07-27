import { NavLink, Outlet, Link } from "react-router-dom";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Newspaper, CalendarDays, Award, ImageIcon,
  Trophy, Settings, Users as UsersIcon, GraduationCap, Home, ArrowLeft,
  BarChart3, ScrollText, Book
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/admin", end: true, label: "Boshqaruv", icon: LayoutDashboard, roles: ["admin", "superadmin", "vice_principal"] },
  { to: "/admin/news", label: "Yangiliklar", icon: Newspaper, roles: ["admin", "superadmin"] },
  { to: "/admin/events", label: "Tadbirlar", icon: CalendarDays, roles: ["admin", "superadmin"] },
  { to: "/admin/certificates", label: "Sertifikatlar", icon: Award, roles: ["admin", "superadmin"] },
  { to: "/admin/gallery", label: "Galereya", icon: ImageIcon, roles: ["admin", "superadmin"] },
  { to: "/admin/proud", label: "Faxrimiz", icon: Trophy, roles: ["admin", "superadmin"] },
  { to: "/admin/library", label: "Kutubxona", icon: Book, roles: ["admin", "superadmin", "librarian"] },
  { to: "/admin/schedule", label: "Dars jadvali", icon: GraduationCap, roles: ["admin", "superadmin", "vice_principal"] },
  { to: "/admin/settings", label: "Sayt sozlamalari", icon: Settings, roles: ["admin", "superadmin"] },
  { to: "/admin/users", label: "Foydalanuvchilar", icon: UsersIcon, roles: ["superadmin"] },
  { to: "/admin/analytics", label: "Analitika", icon: BarChart3, roles: ["superadmin"] },
  { to: "/admin/audit", label: "Audit jurnali", icon: ScrollText, roles: ["superadmin"] },
];

export default function AdminLayout() {
  const { roles } = useRoles();
  const { user } = useAuth();
  const visible = ITEMS.filter((i) => i.roles.some((r) => roles.includes(r as any)));
  return (
    <div className="min-h-screen bg-secondary/30 pt-safe">
      <div className="border-b border-border bg-background">
        <div className="container-page flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-sm">
            <ArrowLeft className="h-4 w-4" /> Saytga qaytish
          </Link>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
        </div>
      </div>
      <div className="container-page py-6 grid gap-6 lg:grid-cols-[240px,1fr]">
        <aside className="lg:sticky lg:top-20 self-start">
          <div className="glass-card p-2">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin panel</div>
            <nav className="grid gap-0.5">
              {visible.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition",
                      isActive ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/60"
                    )
                  }
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}