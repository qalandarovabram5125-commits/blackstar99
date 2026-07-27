import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Btn, Card, Field, PageHeader, inp } from "@/components/admin/ui";
import { Modal } from "./AdminNews";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

type Row = { id?: string; full_name: string; achievement: string; photo_url: string; year: string; sort_order: string };
const blank = (): Row => ({ full_name: "", achievement: "", photo_url: "", year: "", sort_order: "0" });

export default function AdminProud() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin_proud"],
    queryFn: async () => (await api.from("proud_students").select("*").order("sort_order").order("created_at", { ascending: false })).data ?? [],
  });
  async function save() {
    if (!editing) return;
    setBusy(true);
    const payload: any = {
      full_name: editing.full_name,
      achievement: editing.achievement,
      photo_url: editing.photo_url || null,
      year: editing.year ? Number(editing.year) : null,
      sort_order: Number(editing.sort_order) || 0,
    };
    const res = editing.id
      ? await api.from("proud_students").update(payload).eq("id", editing.id)
      : await api.from("proud_students").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    setEditing(null); toast.success("Saqlandi");
    qc.invalidateQueries({ queryKey: ["admin_proud"] });
  }
  async function del(id: string) {
    if (!confirm("O'chirilsinmi?")) return;
    const { error } = await api.from("proud_students").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin_proud"] });
  }
  return (
    <div>
      <PageHeader title="Faxrimiz" subtitle="O'quvchilarning yutuqlari" action={<Btn onClick={() => setEditing(blank())}><Plus className="h-4 w-4" />Yangi</Btn>} />
      <Card>
        {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Yuklanmoqda…</div> :
          !data?.length ? <div className="p-8 text-center text-muted-foreground text-sm">Hozircha yozuvlar yo'q</div> :
          <ul className="divide-y divide-border">
            {data.map((p: any) => (
              <li key={p.id} className="flex items-center gap-4 p-4">
                {p.photo_url ? <img src={p.photo_url} className="h-12 w-12 rounded-full object-cover" alt="" /> : <div className="h-12 w-12 rounded-full bg-secondary" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.achievement} {p.year && `· ${p.year}`}</div>
                </div>
                <Btn variant="ghost" onClick={() => setEditing({ ...p, year: p.year?.toString() ?? "", sort_order: p.sort_order?.toString() ?? "0" })}><Pencil className="h-4 w-4" /></Btn>
                <Btn variant="danger" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Btn>
              </li>
            ))}
          </ul>}
      </Card>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Tahrirlash" : "Yangi"}>
          <Field label="To'liq ism"><input className={inp} value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></Field>
          <Field label="Yutuq"><input className={inp} value={editing.achievement} onChange={(e) => setEditing({ ...editing, achievement: e.target.value })} /></Field>
          <Field label="Rasm">
            <ImageUpload
              value={editing.photo_url}
              onChange={(url) => setEditing({ ...editing, photo_url: url })}
              folder="proud"
              maxMB={5}
              aspect="aspect-square"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Yil"><input type="number" className={inp} value={editing.year} onChange={(e) => setEditing({ ...editing, year: e.target.value })} /></Field>
            <Field label="Tartib"><input type="number" className={inp} value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setEditing(null)}>Bekor</Btn>
            <Btn onClick={save} busy={busy}>Saqlash</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}