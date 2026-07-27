import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Section } from "@/components/ui/section";
import { uzDate } from "@/lib/format";

export default function News() {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ["news_all"],
    queryFn: async () => api.list("news", "order=published_at&dir=desc"),
  });
  return (
    <Section title="Yangiliklar" subtitle="Maktab hayotidagi yangiliklar">
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i)=>(<div key={i} className="h-64 rounded-2xl bg-secondary animate-pulse"/>))}
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Hozircha yangiliklar yo'q</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((n:any)=>(
            <article key={n.id} className="glass-card overflow-hidden hover:shadow-md transition">
              <div className="aspect-[16/9] bg-secondary">
                {n.cover_url && <img src={n.cover_url} alt={n.title} className="h-full w-full object-cover" loading="lazy"/>}
              </div>
              <div className="p-5">
                <div className="text-xs text-muted-foreground">{uzDate(n.published_at)}</div>
                <h3 className="font-semibold tracking-tight mt-1 text-lg">{n.title}</h3>
                {n.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{n.excerpt}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}