import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Btn, Card, Field, PageHeader, inp } from "@/components/admin/ui";
import { Modal } from "./AdminNews";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";
import ImageUpload from "@/components/ImageUpload";

type Row = { id?: string; title: string; description: string; location: string; cover_url: string; starts_at: string; ends_at: string };
const blank = (): Row => ({ title: "", description: "", location: "", cover_url: "", starts_at: new Date().toISOString().slice(0, 16), ends_at: "" });

export default function AdminEvents() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin_events"],
    queryFn: async () => (await api.from("events").select("*").order("starts_at", { ascending: false })).data ?? [],
  });
  async function save() {
    if (!editing) return;
    setBusy(true);
    const payload: any = {
      title: editing.title,
      description: editing.description || null,
      location: editing.location || null,
      cover_url: editing.cover_url || null,
      starts_at: new Date(editing.starts_at).toISOString(),
      ends_at: editing.ends_at ? new Date(editing.ends_at).toISOString() : null,
    };
    const res = editing.id
      ? await api.from("events").update(payload).eq("id", editing.id)
      : await api.from("events").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saqlandi"); setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin_events"] });
  }
  async function del(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    const { error } = await api.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin_events"] });
  }
  return (
    <div>
      <PageHeader title="Tadbirlar" action={<Btn onClick={() => setEditing(blank())}><Plus className="h-4 w-4" />Yangi</Btn>} />
      <Card>
        {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Yuklanmoqda…</div> :
          !data?.length ? <div className="p-8 text-center text-muted-foreground text-sm">Tadbirlar yo'q</div> :
          <ul className="divide-y divide-border">
            {data.map((n: any) => (
              <li key={n.id} className="flex items-center gap-4 p-4">
                {n.cover_url ? <img src={n.cover_url} className="h-14 w-14 rounded-xl object-cover" alt="" /> : <div className="h-14 w-14 rounded-xl bg-secondary" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(n.starts_at)} · {n.location ?? "—"}</div>
                </div>
                <Btn variant="ghost" onClick={() => setEditing({ ...n, starts_at: n.starts_at.slice(0, 16), ends_at: n.ends_at ? n.ends_at.slice(0, 16) : "" })}><Pencil className="h-4 w-4" /></Btn>
                <Btn variant="danger" onClick={() => del(n.id)}><Trash2 className="h-4 w-4" /></Btn>
              </li>
            ))}
          </ul>}
      </Card>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Tahrirlash" : "Yangi tadbir"}>
          <Field label="Nomi"><input className={inp} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
          <Field label="Tavsif"><textarea rows={3} className={inp} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          <Field label="Manzil"><input className={inp} value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></Field>
          <Field label="Muqova rasmi">
            <ImageUpload
              value={editing.cover_url}
              onChange={(url) => setEditing({ ...editing, cover_url: url })}
              folder="events"
              maxMB={5}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Boshlanishi"><input type="datetime-local" className={inp} value={editing.starts_at} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} /></Field>
            <Field label="Tugashi"><input type="datetime-local" className={inp} value={editing.ends_at} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setEditing(null)}>Bekor qilish</Btn>
            <Btn onClick={save} busy={busy}>Saqlash</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}