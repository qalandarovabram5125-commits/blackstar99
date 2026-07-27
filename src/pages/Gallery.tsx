import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Section } from "@/components/ui/section";
import { Heart, X, ChevronLeft, ChevronRight, Image as ImageIcon, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "sonner";

export default function Gallery() {
  const { user } = useAuth();
  const { isSuper } = useRoles();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["gallery_all"],
    queryFn: async () => api.list("gallery", "order=likes_count&dir=desc"),
  });
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [busy, setBusy] = useState(false);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const [likersOpen, setLikersOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setMyLikes(new Set()); return; }
       (async () => {
      const liked = await api.list("gallery");
      setMyLikes(new Set(liked.filter((x:any) => x.user_liked).map((x:any) => x.id)));
    })();
  }, [user, items.length]);

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIdx(null);
      if (e.key === "ArrowLeft") setOpenIdx((i)=> i!==null && i>0 ? i-1 : i);
      if (e.key === "ArrowRight") setOpenIdx((i)=> i!==null && i<items.length-1 ? i+1 : i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIdx, items.length]);

  async function toggleLike(itemId: string) {
    if (!user) { toast.error("Kirish talab qilinadi"); return; }
    const has = myLikes.has(itemId);
    if (has) await api.unlike("gallery", itemId);
    else await api.like("gallery", itemId);
    setMyLikes((s) => { const n = new Set(s); has ? n.delete(itemId) : n.add(itemId); return n; });
    qc.invalidateQueries({ queryKey: ["gallery_all"] });
  }
  async function submitUpload() {
    if (!uploadUrl || !user) return;
    setBusy(true);
    await api.create("gallery", { image_url: uploadUrl, caption: caption || null, uploader_id: user.id });
    toast.success("Yuklandi");
    setUploadUrl(""); setCaption(""); setShowUploader(false);
    qc.invalidateQueries({ queryKey: ["gallery_all"] });
  }

  return (
    <>
      <Section title="Galereya" subtitle="Maktab hayotidan suratlar"
        action={user && (
          <button onClick={() => setShowUploader(true)} className="text-sm px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90">
            + Rasm qo'shish
          </button>
        )}
      >
        {isLoading ? <div className="h-40 rounded-2xl bg-secondary animate-pulse"/> :
          items.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              <ImageIcon className="mx-auto h-10 w-10 mb-2 opacity-50"/>
              Hozircha suratlar yo'q
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2">
              {items.map((it:any, idx:number)=>(
                <div key={it.id} className="relative aspect-square overflow-hidden rounded-md bg-secondary group transition-transform duration-300 hover:scale-[1.03]">
                  <button onClick={()=>setOpenIdx(idx)} className="absolute inset-0">
                    <img src={it.image_url} alt={it.caption ?? ""} loading="lazy" className="h-full w-full object-cover"/>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(it.id); }}
                    className={`absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full text-[10px] px-1.5 py-0.5 transition ${myLikes.has(it.id) ? "bg-red-500 text-white" : "bg-black/60 text-white"}`}
                  >
                    <Heart className={`h-3 w-3 ${myLikes.has(it.id) ? "fill-current" : ""}`}/> {it.likes_count ?? 0}
                  </button>
                  {isSuper && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setLikersOpen(it.id); }}
                      className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                      title="Kim like bosgan"
                    >
                      <Users className="h-3 w-3"/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
      </Section>

      {showUploader && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={() => setShowUploader(false)}>
          <div className="w-full max-w-md glass-card rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Rasm qo'shish</h3>
            <ImageUpload value={uploadUrl} onChange={setUploadUrl} folder="gallery" maxMB={8} aspect="aspect-square" />
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Izoh (ixtiyoriy)" className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowUploader(false)} className="px-3 py-1.5 rounded-lg bg-secondary text-sm">Bekor</button>
              <button onClick={submitUpload} disabled={!uploadUrl || busy} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50">{busy ? "…" : "Yuklash"}</button>
            </div>
          </div>
        </div>
      )}

      {likersOpen && <LikersModal itemId={likersOpen} kind="gallery" onClose={() => setLikersOpen(null)} />}

      {openIdx !== null && items[openIdx] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center">
          <button onClick={()=>setOpenIdx(null)} className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><X className="h-5 w-5"/></button>
          {openIdx > 0 && <button onClick={()=>setOpenIdx(openIdx-1)} className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft className="h-5 w-5"/></button>}
          {openIdx < items.length - 1 && <button onClick={()=>setOpenIdx(openIdx+1)} className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight className="h-5 w-5"/></button>}
          <div className="max-w-5xl max-h-[90vh] p-4 flex flex-col items-center gap-3">
            <img src={items[openIdx].image_url} alt={items[openIdx].caption ?? ""} className="max-h-[80vh] max-w-full object-contain rounded-xl"/>
            <div className="flex items-center gap-3 text-white/90 text-sm">
              <button
                onClick={() => toggleLike(items[openIdx].id)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full transition ${myLikes.has(items[openIdx].id) ? "bg-red-500/20 text-red-300" : "hover:bg-white/10"}`}
              >
                <Heart className={`h-4 w-4 ${myLikes.has(items[openIdx].id) ? "fill-current" : ""}`}/> {items[openIdx].likes_count ?? 0}
              </button>
              {items[openIdx].caption && <span className="opacity-80">{items[openIdx].caption}</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function LikersModal({ itemId, kind, onClose }: { itemId: string; kind: "gallery" | "certificate"; onClose: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const fn = kind === "gallery" ? "gallery_item_likers" : "certificate_likers";
      const arg = kind === "gallery" ? { _item: itemId } : { _cert: itemId };
      const { data } = await api.rpc(fn as any, arg as any);
      setRows((data ?? []) as any[]);
      setLoading(false);
    })();
  }, [itemId, kind]);
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-md glass-card rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Like bosganlar</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4"/></button>
        </div>
        {loading ? <div className="p-6 text-center text-sm text-muted-foreground">Yuklanmoqda…</div> :
          rows.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">Hech kim like bosmagan</div> :
          <ul className="space-y-1 max-h-[55vh] overflow-y-auto">
            {rows.map((r) => (
              <li key={r.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60">
                {r.avatar_url
                  ? <img src={r.avatar_url} className="h-9 w-9 rounded-full object-cover" alt=""/>
                  : <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs">{(r.full_name || "?")[0]}</div>}
                <div className="flex-1 text-sm truncate">{r.full_name || "Foydalanuvchi"}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(r.liked_at).toLocaleDateString("uz-UZ")}</div>
              </li>
            ))}
          </ul>}
      </div>
    </div>
  );
}