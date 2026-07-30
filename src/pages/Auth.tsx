import { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";

export default function Auth() {
  const [params] = useSearchParams();
  const next = params.get("next") || "/";
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={next} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup") {
      const name = fullName.trim();
      if (!/^[\p{L}][\p{L}\s'’ʻ\-]{1,99}$/u.test(name)) {
        toast.error("F.I.SH faqat harflardan iborat boʻlishi kerak");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await api.register(email, password, fullName);
        toast.success("Hisob yaratildi!");
      } else {
        await api.login(email, password);
        toast.success("Tizimga kirildi!");
      }
      window.location.href = next;
    } catch (err: any) {
      toast.error(err.message || "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    if (!(window as any).google?.accounts?.id) {
      setBusy(false);
      toast.error("Google login faqat production muhitda ishlaydi. Iltimos email orqali kiring.");
      return;
    }
    try {
      (window as any).google.accounts.id.prompt();
    } catch { toast.error("Google login xatosi"); }
    setBusy(false);
  }

  // Initialize Google handler on mount
  useEffect(() => {
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "736519004670-89dbm6v2o6fel1dgee1nrs58in747krf.apps.googleusercontent.com",
        callback: async (response: any) => {
          try {
            const data = await api.googleLogin(response.credential);
            toast.success("Google orqali tizimga kirildi!");
            window.location.href = next;
          } catch (err: any) {
            toast.error(err.message || "Google orqali kirish amalga oshmadi");
            setBusy(false);
          }
        },
      });
    }
  }, []);

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 shadow-sm">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground font-semibold">51</span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          {mode === "signin" ? "Tizimga kirish" : "Ro'yxatdan o'tish"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-1">51-maktab portali</p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-background hover:bg-secondary transition text-sm font-medium"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Google bilan kirish
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> yoki <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field icon={UserIcon} value={fullName} onChange={setFullName} placeholder="To'liq ism" required />
          )}
          <Field icon={Mail} type="email" value={email} onChange={setEmail} placeholder="E-pochta" required />
          <Field icon={Lock} type="password" value={password} onChange={setPassword} placeholder="Parol" required minLength={8} />
          {mode === "signup" && (
            <p className="text-xs text-muted-foreground -mt-1">Kamida 8 belgi, harf va raqam aralash</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Kirish" : "Ro'yxatdan o'tish"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : "Allaqachon hisobingiz bormi? Kirish"}
        </button>
      </div>
    </div>
  );
}

function Field({ icon: Icon, ...props }: any) {
  return (
    <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-ring/40 transition">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <input
        {...props}
        onChange={(e: any) => props.onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />
    </label>
  );
}
