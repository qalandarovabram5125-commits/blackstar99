import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Btn, Card, PageHeader } from "@/components/admin/ui";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Trash2, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { fmtDateTime } from "@/lib/format";

const ALL_ROLES = ["student", "teacher", "librarian", "vice_principal", "admin", "superadmin"] as const;
const LABEL: Record<string, string> = {
  student: "O'quvchi", teacher: "O'qituvchi", librarian: "Kutubxonachi",
  vice_principal: "O'quv mudiri", admin: "Admin", superadmin: "SuperAdmin",
};

export default function AdminUsers() {
  const { user } = useAuth();
  const { isSuper } = useRoles();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }, authRes] = await Promise.all([
        api.from("profiles").select("*").order("created_at", { ascending: false }),
        api.from("user_roles").select("*"),
        api.functions.invoke("admin-users", { body: { action: "list" } }),
      ]);
      const byUser = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = byUser.get(r.user_id) ?? [];
        arr.push(r.role); byUser.set(r.user_id, arr);
      });
      const authMap = new Map<string, any>();
      const authUsers = (authRes.data as any)?.users ?? [];
      authUsers.forEach((u: any) => authMap.set(u.id, u));
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: byUser.get(p.id) ?? [],
        auth: authMap.get(p.id) ?? null,
      }));
    },
  });

  async function toggle(uid: string, role: string, has: boolean) {
    if (uid === user?.id && role === "superadmin" && has) {
      return toast.error("O'zingizdan superadmin rolini olib tashlay olmaysiz");
    }
    const res = has
      ? await api.from("user_roles").delete().eq("user_id", uid).eq("role", role as any)
      : await api.from("user_roles").insert({ user_id: uid, role: role as any });
    if (res.error) return toast.error(res.error.message);
    qc.invalidateQueries({ queryKey: ["admin_users"] });
  }
  async function deleteUser(uid: string, name: string) {
    if (uid === user?.id) return toast.error("O'zingizni o'chira olmaysiz");
    if (!confirm(`"${name}" foydalanuvchini butunlay o'chirish?`)) return;
    const { data, error } = await api.functions.invoke("admin-delete-user", { body: { user_id: uid } });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any)?.error);
    toast.success("O'chirildi");
    qc.invalidateQueries({ queryKey: ["admin_users"] });
  }

  async function resetPassword(uid: string, email: string) {
    const pwd = prompt(`"${email}" uchun yangi parol (min 6 belgi):`);
    if (!pwd) return;
    if (pwd.length < 6) return toast.error("Parol kamida 6 belgi");
    const { data, error } = await api.functions.invoke("admin-users", {
      body: { action: "set_password", user_id: uid, password: pwd },
    });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any)?.error);
    toast.success("Parol yangilandi");
  }
  async function changeEmail(uid: string, current: string) {
    const email = prompt("Yangi email:", current);
    if (!email || email === current) return;
    const { data, error } = await api.functions.invoke("admin-users", {
      body: { action: "set_email", user_id: uid, email },
    });
    if (error || (data as any)?.error) return toast.error(error?.message ?? (data as any)?.error);
    toast.success("Email yangilandi");
    qc.invalidateQueries({ queryKey: ["admin_users"] });
  }

  return (
    <div>
      <PageHeader title="Foydalanuvchilar" subtitle="Rollar, email va parolni boshqarish (SuperAdmin)" />
      <div className="mb-4 text-xs text-muted-foreground">
        ⚠️ Parollar shifrlangan va tiklab bo'lmaydi — faqat yangisini o'rnatish mumkin.
      </div>
      <Card>
        {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Yuklanmoqda…</div> :
          !data?.length ? <div className="p-8 text-center text-muted-foreground text-sm">Foydalanuvchilar yo'q</div> :
          <ul className="divide-y divide-border">
            {data.map((p: any) => (
              <li key={p.id} className="p-4 flex flex-wrap items-start gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {p.avatar_url
                    ? <img src={p.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
                    : <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center text-xs font-medium">{(p.full_name ?? "?")[0]}</div>}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.full_name || "Foydalanuvchi"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-mono">{p.auth?.email ?? "—"}</span>
                      {p.class_name ? ` · ${p.class_name}` : ""}
                    </div>
                    {p.auth?.last_sign_in_at && (
                      <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Oxirgi kirish: {fmtDateTime(p.auth.last_sign_in_at)}
                        {p.auth.provider && ` · ${p.auth.provider}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_ROLES.map((r) => {
                    const has = p.roles.includes(r);
                    return (
                      <Btn
                        key={r}
                        variant={has ? "primary" : "secondary"}
                        onClick={() => toggle(p.id, r, has)}
                        className="!px-2.5 !py-1 text-xs"
                      >
                        {LABEL[r]}
                      </Btn>
                    );
                  })}
                  {isSuper && p.auth && (
                    <>
                      <button
                        onClick={() => changeEmail(p.id, p.auth.email ?? "")}
                        className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary"
                        title="Emailni o'zgartirish"
                      >
                        <Mail className="h-4 w-4"/>
                      </button>
                      <button
                        onClick={() => resetPassword(p.id, p.auth.email ?? "")}
                        className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary"
                        title="Parolni yangilash"
                      >
                        <KeyRound className="h-4 w-4"/>
                      </button>
                    </>
                  )}
                  {isSuper && p.id !== user?.id && (
                    <button
                      onClick={() => deleteUser(p.id, p.full_name || "Foydalanuvchi")}
                      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
                      title="Foydalanuvchini o'chirish"
                    >
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>}
      </Card>
    </div>
  );
}