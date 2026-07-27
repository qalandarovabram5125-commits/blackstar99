import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Btn, Card, Field, PageHeader, inp } from "@/components/admin/ui";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";
import ImageUpload from "@/components/ImageUpload";

type Row = { id?: string; title: string; excerpt: string; content: string; cover_url: string; published_at: string };
const blank = (): Row => ({ title: "", excerpt: "", content: "", cover_url: "", published_at: new Date().toISOString().slice(0, 16) });

export default function AdminNews() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin_news"],
    queryFn: async () => {
      const { data, error } = await await api.list("news", "order=published_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function save() {
    if (!editing) return;
    setBusy(true);
    const payload = {
      title: editing.title,
      excerpt: editing.excerpt || null,
      content: editing.content || null,
      cover_url: editing.cover_url || null,
      published_at: new Date(editing.published_at).toISOString(),
    };
    const res = editing.id
      ? await api.from("news").update(payload).eq("id", editing.id)
      : await api.from("news").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saqlandi");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin_news"] });
  }
  async function del(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    const { error } = await api.from("news").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin_news"] });
  }

  return (
    <div>
      <PageHeader
        title="Yangiliklar"
        subtitle="Maktab yangiliklari, e'lonlar va xabarlar"
        action={<Btn onClick={() => setEditing(blank())}><Plus className="h-4 w-4" />Yangi</Btn>}
      />
      <Card>
        {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Yuklanmoqda…</div> :
          !data?.length ? <div className="p-8 text-center text-muted-foreground text-sm">Hozircha yangiliklar yo'q</div> :
          <ul className="divide-y divide-border">
            {data.map((n: any) => (
              <li key={n.id} className="flex items-center gap-4 p-4">
                {n.cover_url
                  ? <img src={n.cover_url} className="h-14 w-14 rounded-xl object-cover" alt="" />
                  : <div className="h-14 w-14 rounded-xl bg-secondary" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(n.published_at)}</div>
                </div>
                <Btn variant="ghost" onClick={() => setEditing({ ...n, published_at: n.published_at.slice(0, 16) })}><Pencil className="h-4 w-4" /></Btn>
                <Btn variant="danger" onClick={() => del(n.id)}><Trash2 className="h-4 w-4" /></Btn>
              </li>
            ))}
          </ul>
        }
      </Card>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Tahrirlash" : "Yangi yangilik"}>
          <Field label="Sarlavha"><input className={inp} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
          <Field label="Qisqacha"><textarea rows={2} className={inp} value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></Field>
          <Field label="To'liq matn"><textarea rows={6} className={inp} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></Field>
          <Field label="Muqova rasmi">
            <ImageUpload
              value={editing.cover_url}
              onChange={(url) => setEditing({ ...editing, cover_url: url })}
              folder="news"
              maxMB={5}
            />
          </Field>
          <Field label="Chop etish vaqti"><input type="datetime-local" className={inp} value={editing.published_at} onChange={(e) => setEditing({ ...editing, published_at: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setEditing(null)}>Bekor qilish</Btn>
            <Btn onClick={save} busy={busy}>Saqlash</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Modal({ children, onClose, title }: any) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}