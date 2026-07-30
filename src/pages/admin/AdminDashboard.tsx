import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Newspaper, CalendarDays, Award, ImageIcon, Trophy, GraduationCap, Users } from "lucide-react";

function useCount(table: string) {
  return useQuery({
    queryKey: ["count", table],
    queryFn: async () => {
      const { count } = await (api as any).from(table).select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });
}

const CARDS = [
  { table: "news", label: "Yangiliklar", icon: Newspaper },
  { table: "events", label: "Tadbirlar", icon: CalendarDays },
  { table: "certificates", label: "Sertifikatlar", icon: Award },
  { table: "gallery", label: "Galereya", icon: ImageIcon },
  { table: "proud", label: "Faxrimiz", icon: Trophy },
  { table: "schedule", label: "Jadval", icon: GraduationCap },
];

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Boshqaruv paneli</h1>
      <p className="text-muted-foreground text-sm mt-1">Maktab kontentini boshqaring</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        {CARDS.map((c) => <Card key={c.table} {...c} />)}
      </div>
    </div>
  );
}

function Card({ table, label, icon: Icon }: any) {
  const q = useCount(table);
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><Icon className="h-4 w-4" /></div>
        <div className="text-2xl font-semibold tabular-nums">{q.isLoading ? "—" : q.data}</div>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}