import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, User as UserIcon, LogOut, Shield, MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useUnread } from "@/hooks/useUnread";
import { Logo } from "@/components/Logo";

const NAV = [
  { to: "/", label: "Bosh sahifa" },
  { to: "/news", label: "Yangiliklar" },
  { to: "/events", label: "Tadbirlar" },
  { to: "/certificates", label: "Sertifikatlar" },
  { to: "/gallery", label: "Galereya" },
  { to: "/library", label: "Kutubxona" },
  { to: "/schedule", label: "Jadval" },
  { to: "/contact", label: "Aloqa" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useRoles();
  const { total: unread } = useUnread();
  return (
    <header className="sticky top-0 z-40 glass-sheet pt-safe">
      <div className="container-page flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo size={32} />
          <span className="hidden sm:inline">51-maktab</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          {user && (
            <Link to="/chat" className="relative hidden sm:grid h-9 w-9 place-items-center rounded-full hover:bg-secondary" aria-label="Chat">
              <MessageCircle className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-secondary hover:bg-muted"
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          {user ? (
            <div className="hidden sm:flex items-center gap-1">
              <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary" aria-label="Profil">
                <UserIcon className="h-4 w-4" />
              </Link>
              <button onClick={signOut} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary" aria-label="Chiqish">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-sm font-medium bg-foreground text-background hover:opacity-90"
            >
              Kirish
            </Link>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
            aria-label="Menyu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur">
          <nav className="container-page grid gap-1 py-3">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2.5 rounded-xl text-[15px] font-medium",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
            <div className="h-px bg-border my-2" />
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-xl text-[15px] font-medium text-muted-foreground">Profil</Link>
                <Link to="/chat" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-xl text-[15px] font-medium text-muted-foreground">Chat</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-xl text-[15px] font-medium text-muted-foreground">Admin panel</Link>
                )}
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="text-left px-3 py-2.5 rounded-xl text-[15px] font-medium text-muted-foreground"
                >Chiqish</button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-xl text-[15px] font-medium bg-foreground text-background text-center">
                Kirish / Ro'yxatdan o'tish
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}