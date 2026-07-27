import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { Section } from "@/components/ui/section";
import { Award, Heart, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { LikersModal } from "./Gallery";
import { toast } from "sonner";

export default function Certificates() {
  const { user } = useAuth();
  const { isSuper } = useRoles();
  const qc = useQueryClient();
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [likersOpen, setLikersOpen] = useState<string | null>(null);
  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["certs_all"],
    queryFn: async () => api.list("certificates", "order=created_at&dir=desc"),
  });
  useEffect(() => {
    if (!user) return;
    (async () => {
      const liked = await api.list("certificates");
      setMyLikes(new Set(liked.filter((x:any) => x.user_liked).map((x:any) => x.id)));
    })();
  }, [user, certs.length]);

  async function toggle(id: string) {
    if (!user) { toast.error("Kirish talab qilinadi"); return; }
    const has = myLikes.has(id);
    if (has) await api.unlike("certificates", id);
    else await api.like("certificates", id);
    setMyLikes((s) => { const n = new Set(s); has ? n.delete(id) : n.add(id); return n; });
    qc.invalidateQueries({ queryKey: ["certs_all"] });
  }

  return (
    <Section title="Sertifikatlar" subtitle="O'quvchilarimizning sovrinli yutuqlari">
      {isLoading ? <div className="h-40 rounded-2xl bg-secondary animate-pulse"/> :
        certs.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Sertifikatlar yo'q</div> :
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {certs.map((c:any)=>(
            <article key={c.id} className="glass-card overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:shadow-lg group">
              <div className="aspect-[4/5] bg-gradient-to-br from-secondary to-muted relative grid place-items-center">
                {c.image_url ? <img src={c.image_url} alt={c.recipient_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy"/> : <Award className="h-12 w-12 text-muted-foreground/50"/>}
              </div>
              <div className="p-3">
                <h3 className="font-semibold tracking-tight text-sm truncate">{c.recipient_name}</h3>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {[c.class_name, c.subject, c.level].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => toggle(c.id)}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition ${myLikes.has(c.id) ? "bg-red-500/10 text-red-500" : "text-muted-foreground hover:bg-secondary"}`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${myLikes.has(c.id) ? "fill-current" : ""}`}/> {c.likes_count ?? 0}
                  </button>
                  {isSuper && (
                    <button onClick={() => setLikersOpen(c.id)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-secondary opacity-0 group-hover:opacity-100 transition" title="Kim like bosgan">
                      <Users className="h-3 w-3"/>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>}
      {likersOpen && <LikersModal itemId={likersOpen} kind="certificate" onClose={() => setLikersOpen(null)} />}
    </Section>
  );
}