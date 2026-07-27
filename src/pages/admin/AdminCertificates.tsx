import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Btn, Card, Field, PageHeader, inp } from "@/components/admin/ui";
import { Modal } from "./AdminNews";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

type Row = { id?: string; recipient_name: string; subject: string; level: string; class_name: string; image_url: string };
const blank = (): Row => ({ recipient_name: "", subject: "", level: "", class_name: "", image_url: "" });

export default function AdminCertificates() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin_certs"],
    queryFn: async () => (await api.from("certificates").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  async function save() {
    if (!editing) return;
    setBusy(true);
    const payload: any = {
      recipient_name: editing.recipient_name,
      subject: editing.subject || null,
      level: editing.level || null,
      class_name: editing.class_name || null,
      image_url: editing.image_url,
    };
    const res = editing.id
      ? await api.from("certificates").update(payload).eq("id", editing.id)
      : await api.from("certificates").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    setEditing(null); toast.success("Saqlandi");
    qc.invalidateQueries({ queryKey: ["admin_certs"] });
  }
  async function del(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    const { error } = await api.from("certificates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin_certs"] });
  }
  return (
    <div>
      <PageHeader title="Sertifikatlar" action={<Btn onClick={() => setEditing(blank())}><Plus className="h-4 w-4" />Yangi</Btn>} />
      <Card>
        {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Yuklanmoqda…</div> :
          !data?.length ? <div className="p-8 text-center text-muted-foreground text-sm">Sertifikatlar yo'q</div> :
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
            {data.map((c: any) => (
              <div key={c.id} className="rounded-xl border border-border overflow-hidden">
                <img src={c.image_url} className="aspect-video w-full object-cover" alt="" />
                <div className="p-3">
                  <div className="font-medium truncate">{c.recipient_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{[c.subject, c.level, c.class_name].filter(Boolean).join(" · ")}</div>
                  <div className="mt-2 flex gap-1.5">
                    <Btn variant="secondary" onClick={() => setEditing(c)} className="!px-3 !py-1.5 text-xs"><Pencil className="h-3.5 w-3.5" />Tahrir</Btn>
                    <Btn variant="danger" onClick={() => del(c.id)} className="!px-3 !py-1.5 text-xs"><Trash2 className="h-3.5 w-3.5" /></Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>}
      </Card>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Tahrirlash" : "Yangi sertifikat"}>
          <Field label="Egasining ismi"><input className={inp} value={editing.recipient_name} onChange={(e) => setEditing({ ...editing, recipient_name: e.target.value })} /></Field>
          <Field label="Fan"><input className={inp} value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></Field>
          <Field label="Daraja"><input className={inp} value={editing.level} onChange={(e) => setEditing({ ...editing, level: e.target.value })} placeholder="masalan: B2, Oltin medal" /></Field>
          <Field label="Sinf"><input className={inp} value={editing.class_name} onChange={(e) => setEditing({ ...editing, class_name: e.target.value })} /></Field>
          <Field label="Sertifikat rasmi">
            <ImageUpload
              value={editing.image_url}
              onChange={(url) => setEditing({ ...editing, image_url: url })}
              folder="certificates"
              maxMB={5}
              aspect="aspect-[4/3]"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setEditing(null)}>Bekor qilish</Btn>
            <Btn onClick={save} busy={busy}>Saqlash</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}