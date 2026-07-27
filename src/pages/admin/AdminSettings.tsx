import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Btn, Card, Field, PageHeader, inp } from "@/components/admin/ui";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import { useRoles } from "@/hooks/useRoles";

export default function AdminSettings() {
  const [s, setS] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const { isSuper } = useRoles();

  useEffect(() => {
    (async () => {
      const { data } = await api.from("site_settings").select("*").eq("id", 1).maybeSingle();
      setS(data ?? {
        id: 1, school_name: "51-maktab", motto: "", hero_image_url: "",
        phone: "", email: "", address: "", latitude: null, longitude: null,
        stat_students: 0, stat_teachers: 0, stat_workers: 0, stat_university_pct: 0,
      });
    })();
  }, []);

  async function save() {
    if (!s) return;
    setBusy(true);
    const { error } = await api.from("site_settings").upsert({ ...s, id: 1 });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Sozlamalar saqlandi");
  }

  if (!s) return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda…</div>;
  const u = (k: string) => (e: any) => setS({ ...s, [k]: e.target.value });
  const n = (k: string) => (e: any) => setS({ ...s, [k]: e.target.value === "" ? null : Number(e.target.value) });

  return (
    <div>
      <PageHeader title="Sayt sozlamalari" subtitle="Maktab nomi, shiori, kontaktlar va statistika" />
      <div className="space-y-4">
        <Card className="p-5 space-y-4">
          <div className="text-sm font-semibold">Asosiy</div>
          <Field label="Maktab nomi"><input className={inp} value={s.school_name ?? ""} onChange={u("school_name")} /></Field>
          <Field label="Shior / motto"><input className={inp} value={s.motto ?? ""} onChange={u("motto")} /></Field>
          {isSuper && (
            <Field label="Maktab logotipi (faqat SuperAdmin)">
              <ImageUpload
                value={s.logo_url ?? ""}
                onChange={(url) => setS({ ...s, logo_url: url || null })}
                folder="logo"
                maxMB={2}
                aspect="aspect-square"
                label="Logotip yuklash"
              />
            </Field>
          )}
          <Field label="Hero rasm (tavsiya: 1920×1080 px, 16:9, ≤5MB, .jpg/.webp)">
            <ImageUpload
              value={s.hero_image_url ?? ""}
              onChange={(url) => setS({ ...s, hero_image_url: url || null })}
              folder="site"
              maxMB={5}
            />
          </Field>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="text-sm font-semibold">Aloqa</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Telefon"><input className={inp} value={s.phone ?? ""} onChange={u("phone")} /></Field>
            <Field label="E-pochta"><input className={inp} value={s.email ?? ""} onChange={u("email")} /></Field>
          </div>
          <Field label="Manzil"><input className={inp} value={s.address ?? ""} onChange={u("address")} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Kenglik (lat)"><input type="number" step="any" className={inp} value={s.latitude ?? ""} onChange={n("latitude")} /></Field>
            <Field label="Uzunlik (lng)"><input type="number" step="any" className={inp} value={s.longitude ?? ""} onChange={n("longitude")} /></Field>
          </div>
          {isSuper && (
            <Field label="Telegram chat ID (faqat SuperAdmin) — aloqa formasidan xabarlar shu chatga yuboriladi">
              <input
                className={inp}
                value={s.admin_telegram_chat_id ?? ""}
                onChange={u("admin_telegram_chat_id")}
                placeholder="masalan: 123456789 yoki -1001234567890"
              />
            </Field>
          )}
        </Card>

        <Card className="p-5 space-y-4">
          <div className="text-sm font-semibold">Statistika</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="O'quvchilar"><input type="number" className={inp} value={s.stat_students ?? 0} onChange={n("stat_students")} /></Field>
            <Field label="O'qituvchilar"><input type="number" className={inp} value={s.stat_teachers ?? 0} onChange={n("stat_teachers")} /></Field>
            <Field label="Xodimlar"><input type="number" className={inp} value={s.stat_workers ?? 0} onChange={n("stat_workers")} /></Field>
            <Field label="OTM-ga kirish %"><input type="number" className={inp} value={s.stat_university_pct ?? 0} onChange={n("stat_university_pct")} /></Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Btn onClick={save} busy={busy}>Saqlash</Btn>
        </div>
      </div>
    </div>
  );
}
