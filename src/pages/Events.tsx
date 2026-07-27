import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Section } from "@/components/ui/section";
import { uzDateTime } from "@/lib/format";
import { Calendar, MapPin } from "lucide-react";

export default function Events() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events_all"],
    queryFn: async () => api.list("events", "order=starts_at&dir=asc"),
  });
  const upcoming = events.filter((e:any)=>new Date(e.starts_at) >= new Date());
  const past = events.filter((e:any)=>new Date(e.starts_at) < new Date());

  return (
    <>
      <Section title="Tadbirlar" subtitle="Yaqinlashayotgan tadbirlar">
        {isLoading ? <div className="h-40 rounded-2xl bg-secondary animate-pulse"/> :
          upcoming.length === 0 ? <Empty/> :
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{upcoming.map(card)}</div>}
      </Section>
      {past.length > 0 && (
        <Section title="O'tgan tadbirlar">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80">{past.map(card)}</div>
        </Section>
      )}
    </>
  );
}
const Empty = () => <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Tadbirlar yo'q</div>;
const card = (e:any) => (
  <article key={e.id} className="glass-card overflow-hidden">
    <div className="aspect-[16/9] bg-gradient-primary relative">
      {e.cover_url && <img src={e.cover_url} alt={e.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy"/>}
    </div>
    <div className="p-5">
      <h3 className="font-semibold tracking-tight text-lg">{e.title}</h3>
      {e.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5"/>{uzDateTime(e.starts_at)}</span>
        {e.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{e.location}</span>}
      </div>
    </div>
  </article>
);