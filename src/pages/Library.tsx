import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/api/client";
import { Section } from "@/components/ui/section";
import { Book, Download, ExternalLink, Search } from "lucide-react";

const CLASSES = ["Barchasi","1-sinf","2-sinf","3-sinf","4-sinf","5-sinf","6-sinf","7-sinf","8-sinf","9-sinf","10-sinf","11-sinf"];

export default function Library() {
  const { data: books = [] } = useQuery({
    queryKey: ["library_all"],
    queryFn: async () => api.list("library", "order=created_at&dir=desc"),
  });
  const [klass, setKlass] = useState("Barchasi");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return books.filter((b:any) => {
      if (klass !== "Barchasi" && b.class_name !== klass) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        return [b.title, b.author, b.subject].filter(Boolean).some((v:string)=>v.toLowerCase().includes(s));
      }
      return true;
    });
  }, [books, klass, q]);

  const suggestions = useMemo(()=>{
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    return books.filter((b:any)=>b.title.toLowerCase().includes(s)).slice(0,5);
  }, [q, books]);

  return (
    <Section title="Kutubxona" subtitle="Darslik va qo'shimcha adabiyotlar">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Kitob, muallif yoki fan bo'yicha qidirish..."
            className="w-full h-11 pl-10 pr-3 rounded-full border border-white/40 bg-white/50 backdrop-blur text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/70"
          />
          {suggestions.length > 0 && q && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-popover shadow-md overflow-hidden">
              {suggestions.map((s:any)=>(
                <button key={s.id} onClick={()=>setQ(s.title)} className="block w-full text-left px-4 py-2 hover:bg-secondary text-sm">
                  {s.title} <span className="text-muted-foreground text-xs">{s.author}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {CLASSES.map(c=>(
            <button key={c} onClick={()=>setKlass(c)} className={`shrink-0 px-3.5 h-11 rounded-full text-sm font-medium border transition ${klass===c?"bg-foreground text-background border-foreground":"glass-pill text-muted-foreground hover:text-foreground"}`}>{c}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Kitoblar topilmadi</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b:any)=>(
            <article key={b.id} className="glass-card p-4 flex gap-3">
              <div className="shrink-0 h-24 w-16 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground overflow-hidden">
                {b.cover_url ? <img src={b.cover_url} alt={b.title} className="h-full w-full object-cover"/> : <Book className="h-6 w-6"/>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold tracking-tight text-sm leading-tight line-clamp-2">{b.title}</h3>
                <div className="text-xs text-muted-foreground mt-1 truncate">{b.author}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{[b.subject, b.class_name].filter(Boolean).join(" · ")}</div>
                <div className="mt-2 flex gap-2">
                  <a href={b.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-accent">
                    <ExternalLink className="h-3 w-3"/> Ochish
                  </a>
                  <a href={b.file_url} download className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-accent">
                    <Download className="h-3 w-3"/> Yuklash
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}