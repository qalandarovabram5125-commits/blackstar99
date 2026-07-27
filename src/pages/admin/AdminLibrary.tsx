import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Btn, Card, Field, PageHeader, inp } from "@/components/admin/ui";
import { Pencil, Plus, Trash2, Book } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import FileUpload from "@/components/FileUpload";
import { Modal } from "./AdminNews";
import { useAuth } from "@/hooks/useAuth";

type Row = {
  id?: string; title: string; author: string; subject: string; class_name: string;
  description: string; cover_url: string; file_url: string;
};
const blank = (): Row => ({ title: "", author: "", subject: "", class_name: "", description: "", cover_url: "", file_url: "" });
const CLASSES = ["","1-sinf","2-sinf","3-sinf","4-sinf","5-sinf","6-sinf","7-sinf","8-sinf","9-sinf","10-sinf","11-sinf"];

export default function AdminLibrary() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin_library"],
    queryFn: async () => {
      const { data, error } = await await api.list("library_books", "order=created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function save() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.file_url) {
      toast.error("Sarlavha va fayl majburiy");
      return;
    }
    setBusy(true);
    const payload: any = {
      title: editing.title,
      author: editing.author || null,
      subject: editing.subject || null,
      class_name: editing.class_name || null,
      description: editing.description || null,
      cover_url: editing.cover_url || null,
      file_url: editing.file_url,
    };
    if (!editing.id) payload.uploader_id = user?.id ?? null;
    const res = editing.id
      ? await api.from("library_books").update(payload).eq("id", editing.id)
      : await api.from("library_books").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saqlandi");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin_library"] });
  }

  async function del(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    const { error } = await api.from("library_books").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin_library"] });
  }

  return (
    <div>
      <PageHeader
        title="Kutubxona"
        subtitle="Darslik va qo'shimcha adabiyotlar (max 50MB)"
        action={<Btn onClick={() => setEditing(blank())}><Plus className="h-4 w-4" />Yangi kitob</Btn>}
      />
      <Card>
        {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Yuklanmoqda…</div> :
          !data?.length ? <div className="p-8 text-center text-muted-foreground text-sm">Hozircha kitoblar yo'q</div> :
          <ul className="divide-y divide-border">
            {data.map((b: any) => (
              <li key={b.id} className="flex items-center gap-4 p-4">
                {b.cover_url
                  ? <img src={b.cover_url} className="h-14 w-10 rounded-lg object-cover" alt="" />
                  : <div className="h-14 w-10 rounded-lg bg-secondary grid place-items-center"><Book className="h-5 w-5 text-muted-foreground" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{b.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[b.author, b.subject, b.class_name].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <Btn variant="ghost" onClick={() => setEditing({
                  id: b.id, title: b.title ?? "", author: b.author ?? "", subject: b.subject ?? "",
                  class_name: b.class_name ?? "", description: b.description ?? "",
                  cover_url: b.cover_url ?? "", file_url: b.file_url ?? "",
                })}><Pencil className="h-4 w-4" /></Btn>
                <Btn variant="danger" onClick={() => del(b.id)}><Trash2 className="h-4 w-4" /></Btn>
              </li>
            ))}
          </ul>
        }
      </Card>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Tahrirlash" : "Yangi kitob"}>
          <Field label="Sarlavha"><input className={inp} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Muallif"><input className={inp} value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></Field>
            <Field label="Fan"><input className={inp} value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></Field>
          </div>
          <Field label="Sinf">
            <select className={inp} value={editing.class_name} onChange={(e) => setEditing({ ...editing, class_name: e.target.value })}>
              {CLASSES.map(c => <option key={c} value={c}>{c || "— tanlanmagan —"}</option>)}
            </select>
          </Field>
          <Field label="Tavsif"><textarea rows={3} className={inp} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          <Field label="Muqova rasmi (ixtiyoriy)">
            <ImageUpload value={editing.cover_url} onChange={(url) => setEditing({ ...editing, cover_url: url })} folder="library/covers" maxMB={3} aspect="aspect-[3/4]" />
          </Field>
          <Field label="Kitob fayli (PDF, DOC, EPUB...)">
            <FileUpload value={editing.file_url} onChange={(url) => setEditing({ ...editing, file_url: url })} folder="library/files" maxMB={50} />
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