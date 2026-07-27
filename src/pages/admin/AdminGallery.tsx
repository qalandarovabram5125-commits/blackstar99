import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Btn, Card, Field, PageHeader, inp } from "@/components/admin/ui";
import { Modal } from "./AdminNews";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminGallery() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [image_url, setImage] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin_gallery"],
    queryFn: async () => (await api.from("gallery_items").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  async function add() {
    setBusy(true);
    const { error } = await api.from("gallery_items").insert({ image_url, caption: caption || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    setAdding(false); setImage(""); setCaption(""); toast.success("Qo'shildi");
    qc.invalidateQueries({ queryKey: ["admin_gallery"] });
  }
  async function del(id: string) {
    if (!confirm("O'chirilsinmi?")) return;
    const { error } = await api.from("gallery_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin_gallery"] });
  }
  return (
    <div>
      <PageHeader title="Galereya moderatsiyasi" subtitle="Rasmlarni qo'shing yoki o'chiring" action={<Btn onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Rasm qo'shish</Btn>} />
      <Card className="p-3">
        {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Yuklanmoqda…</div> :
          !data?.length ? <div className="p-8 text-center text-muted-foreground text-sm">Galereya bo'sh</div> :
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {data.map((g: any) => (
              <div key={g.id} className="relative group rounded-xl overflow-hidden">
                <img src={g.image_url} className="aspect-square w-full object-cover" alt="" />
                <button onClick={() => del(g.id)} className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 opacity-0 group-hover:opacity-100 transition text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
                {g.caption && <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs p-2 truncate">{g.caption}</div>}
              </div>
            ))}
          </div>}
      </Card>
      {adding && (
        <Modal onClose={() => setAdding(false)} title="Yangi rasm">
          <Field label="Rasm URL"><input className={inp} value={image_url} onChange={(e) => setImage(e.target.value)} placeholder="https://..." /></Field>
          <Field label="Izoh"><input className={inp} value={caption} onChange={(e) => setCaption(e.target.value)} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setAdding(false)}>Bekor</Btn>
            <Btn onClick={add} busy={busy} disabled={!image_url}>Qo'shish</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}