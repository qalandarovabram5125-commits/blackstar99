import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { api } from "@/api/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

const ROLE_LABEL: Record<string, string> = {
  student: "O'quvchi",
  teacher: "O'qituvchi",
  librarian: "Kutubxonachi",
  vice_principal: "O'quv ishlari mudiri",
  admin: "Administrator",
  superadmin: "Super Administrator",
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const { roles } = useRoles();
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name ?? "");
      setClassName(user.class_name ?? "");
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatar_url ?? "");
      setLoading(false);
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    await api.updateProfile({ full_name: fullName, class_name: className || null, bio: bio || null, avatar_url: avatarUrl || null });
    setSaving(false);
    if (saving) return;
    toast.success("Profil saqlandi");
  }

  if (loading) return <div className="container-page py-20 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;

  return (
    <div className="container-page py-10 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Profil</h1>
      <p className="text-muted-foreground mt-1">{user?.email}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {roles.map((r) => (
          <span key={r} className="px-2.5 py-1 rounded-full text-xs bg-secondary">{ROLE_LABEL[r] ?? r}</span>
        ))}
      </div>

      <div className="mt-8 glass-card rounded-3xl p-6 space-y-4">
        <Field label="To'liq ism"><input className={inp} value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Sinf (masalan: 9-A)"><input className={inp} value={className} onChange={(e) => setClassName(e.target.value)} /></Field>
        <Field label="Avatar">
          <ImageUpload
            value={avatarUrl}
            onChange={setAvatarUrl}
            folder="avatars"
            maxMB={3}
            aspect="aspect-square"
          />
        </Field>
        <Field label="Bio"><textarea rows={3} className={inp} value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
        <div className="flex justify-between pt-2">
          <button onClick={signOut} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary">Chiqish</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl bg-foreground text-background text-sm font-medium inline-flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/40";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}