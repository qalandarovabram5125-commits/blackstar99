import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Card, PageHeader } from "@/components/admin/ui";
import { Loader2 } from "lucide-react";

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { api.getAnalytics().then(setData).catch((e:any) => setErr(e.message)); }, []);
  if (err) return <div className="p-6 text-destructive text-sm">{err}</div>;
  if (!data) return <div className="p-10 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const stats = [
    { label: "Foydalanuvchilar", value: data.users },
    { label: "Yangiliklar", value: data.news },
    { label: "Tadbirlar", value: data.events },
    { label: "Sertifikatlar", value: data.certificates },
    { label: "Galereya", value: data.gallery },
    { label: "Kitoblar", value: data.books },
    { label: "Xabarlar", value: data.messages },
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

    </div>
  );
}