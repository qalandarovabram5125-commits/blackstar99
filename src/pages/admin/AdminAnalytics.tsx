import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Card, PageHeader } from "@/components/admin/ui";
import { Loader2 } from "lucide-react";

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.rpc("admin_analytics").then(({ data, error }) => { if (error) setErr(error.message); else setData(data); }); }, []);
  if (err) return <div className="p-6 text-destructive text-sm">{err}</div>;
  if (!data) return <div className="p-10 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const stats = [
    { label: "Foydalanuvchilar", value: data.users },
    { label: "Oxirgi 7 kun foydalanuvchi", value: data.new_users_7d },
    { label: "Yangiliklar", value: data.news },
    { label: "Tadbirlar", value: data.events },
    { label: "Sertifikatlar", value: data.certificates },
    { label: "Galereya", value: data.gallery },
    { label: "Kitoblar", value: data.books },
    { label: "Chat xonalari", value: data.rooms },
    { label: "Jami xabarlar", value: data.messages },
    { label: "24s xabarlar", value: data.messages_24h },
    { label: "24s audit yozuvlari", value: data.audit_24h },
  ];
  return (
    <div>
      <PageHeader title="Analitika" subtitle="Tizim statistikasi (real vaqt)" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-semibold mt-1">{s.value ?? 0}</div>
          </Card>
        ))}
      </div>
      <h2 className="text-lg font-semibold mt-8 mb-3">Rollar bo'yicha</h2>
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries((data.roles ?? {}) as Record<string, number>).map(([role, n]) => (
            <div key={role} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
              <span className="capitalize">{role}</span><span className="font-semibold">{n}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}