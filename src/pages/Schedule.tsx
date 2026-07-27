import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/api/client";
import { Section } from "@/components/ui/section";
import { uzDayName } from "@/lib/format";

export default function Schedule() {
  const { data: entries = [] } = useQuery({
    queryKey: ["schedule_all"],
    queryFn: async () => api.list("schedule", "order=day_of_week&dir=asc&limit=200"),
  });
  const classes = useMemo(()=>Array.from(new Set(entries.map((e:any)=>e.class_name))).sort(), [entries]);
  const [klass, setKlass] = useState<string | null>(null);
  const active = klass ?? classes[0];
  const filtered = entries.filter((e:any)=>e.class_name === active);
  const byDay = useMemo(()=>{
    const m: Record<number, any[]> = {};
    filtered.forEach((e:any)=>{ (m[e.day_of_week] ??= []).push(e); });
    return m;
  }, [filtered]);

  return (
    <Section title="Dars jadvali" subtitle="Sinflar bo'yicha haftalik jadval">
      {classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Jadval kiritilmagan</div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-5">
            {classes.map(c=>(
              <button key={c} onClick={()=>setKlass(c)} className={`shrink-0 px-3.5 h-10 rounded-full text-sm font-medium border transition ${active===c?"bg-foreground text-background border-foreground":"glass-pill text-muted-foreground hover:text-foreground"}`}>{c}</button>
            ))}
          </div>
          <div className="grid gap-3">
            {[1,2,3,4,5,6].map(d=>{
              const items = byDay[d] ?? [];
              if (items.length === 0) return null;
              return (
                <div key={d} className="glass-card overflow-hidden">
                  <div className="px-4 py-2.5 bg-secondary text-sm font-semibold">{uzDayName(d)}</div>
                  <div className="divide-y divide-border">
                    {items.map((e:any)=>(
                      <div key={e.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="text-xs text-muted-foreground tabular-nums w-24 shrink-0">{e.start_time.slice(0,5)}–{e.end_time.slice(0,5)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{e.subject}</div>
                          <div className="text-xs text-muted-foreground truncate">{[e.teacher_name, e.room && `Xona ${e.room}`].filter(Boolean).join(" · ")}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">#{e.period_no}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Section>
  );
}