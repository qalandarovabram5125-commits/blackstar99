import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Btn, Card, Field, PageHeader, inp } from "@/components/admin/ui";
import { Modal } from "./AdminNews";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uzDayName } from "@/lib/format";

type Row = {
  id?: string; class_name: string; day_of_week: number; period_no: number;
  subject: string; teacher_name: string; room: string; start_time: string; end_time: string;
};
const blank = (): Row => ({ class_name: "", day_of_week: 1, period_no: 1, subject: "", teacher_name: "", room: "", start_time: "08:00", end_time: "08:45" });

export default function AdminSchedule() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin_schedule"],
    queryFn: async () => (await api.from("schedule_entries").select("*").order("class_name").order("day_of_week").order("period_no")).data ?? [],
  });
  const classes = useMemo(() => Array.from(new Set((data ?? []).map((r: any) => r.class_name))).sort(), [data]);
  const filtered = useMemo(() => (data ?? []).filter((r: any) => !classFilter || r.class_name === classFilter), [data, classFilter]);

  async function save() {
    if (!editing) return;
    setBusy(true);
    const payload: any = {
      class_name: editing.class_name, day_of_week: Number(editing.day_of_week), period_no: Number(editing.period_no),
      subject: editing.subject, teacher_name: editing.teacher_name || null, room: editing.room || null,
      start_time: editing.start_time, end_time: editing.end_time,
    };
    const res = editing.id
      ? await api.from("schedule_entries").update(payload).eq("id", editing.id)
      : await api.from("schedule_entries").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    setEditing(null); toast.success("Saqlandi");
    qc.invalidateQueries({ queryKey: ["admin_schedule"] });
  }
  async function del(id: string) {
    if (!confirm("O'chirilsinmi?")) return;
    const { error } = await api.from("schedule_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin_schedule"] });
  }
  return (
    <div>
      <PageHeader title="Dars jadvali" subtitle="Sinflar uchun jadval tuzish" action={<Btn onClick={() => setEditing(blank())}><Plus className="h-4 w-4" />Yangi dars</Btn>} />
      {classes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button onClick={() => setClassFilter("")} className={`px-3 py-1.5 rounded-full text-xs ${!classFilter ? "bg-foreground text-background" : "bg-secondary"}`}>Hammasi</button>
          {classes.map((c) => (
            <button key={c as string} onClick={() => setClassFilter(c as string)} className={`px-3 py-1.5 rounded-full text-xs ${classFilter === c ? "bg-foreground text-background" : "bg-secondary"}`}>{c as string}</button>
          ))}
        </div>
      )}
      <Card>
        {isLoading ? <div className="p-8 text-center text-muted-foreground text-sm">Yuklanmoqda…</div> :
          !filtered.length ? <div className="p-8 text-center text-muted-foreground text-sm">Jadval bo'sh</div> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr><Th>Sinf</Th><Th>Kun</Th><Th>№</Th><Th>Vaqt</Th><Th>Fan</Th><Th>O'qituvchi</Th><Th>Xona</Th><Th></Th></tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-t border-border">
                    <Td>{r.class_name}</Td><Td>{uzDayName(r.day_of_week)}</Td><Td>{r.period_no}</Td>
                    <Td className="tabular-nums">{r.start_time?.slice(0, 5)}–{r.end_time?.slice(0, 5)}</Td>
                    <Td>{r.subject}</Td><Td>{r.teacher_name ?? "—"}</Td><Td>{r.room ?? "—"}</Td>
                    <Td>
                      <div className="flex gap-1 justify-end">
                        <Btn variant="ghost" onClick={() => setEditing({ ...r })} className="!p-2"><Pencil className="h-3.5 w-3.5" /></Btn>
                        <Btn variant="danger" onClick={() => del(r.id)} className="!p-2"><Trash2 className="h-3.5 w-3.5" /></Btn>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
      </Card>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Darsni tahrirlash" : "Yangi dars"}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sinf"><input className={inp} value={editing.class_name} onChange={(e) => setEditing({ ...editing, class_name: e.target.value })} placeholder="9-A" /></Field>
            <Field label="Kun">
              <select className={inp} value={editing.day_of_week} onChange={(e) => setEditing({ ...editing, day_of_week: Number(e.target.value) })}>
                {[1,2,3,4,5,6].map((d) => <option key={d} value={d}>{uzDayName(d)}</option>)}
              </select>
            </Field>
            <Field label="Dars №"><input type="number" min={1} className={inp} value={editing.period_no} onChange={(e) => setEditing({ ...editing, period_no: Number(e.target.value) })} /></Field>
            <Field label="Xona"><input className={inp} value={editing.room} onChange={(e) => setEditing({ ...editing, room: e.target.value })} /></Field>
            <Field label="Boshlanish"><input type="time" className={inp} value={editing.start_time} onChange={(e) => setEditing({ ...editing, start_time: e.target.value })} /></Field>
            <Field label="Tugash"><input type="time" className={inp} value={editing.end_time} onChange={(e) => setEditing({ ...editing, end_time: e.target.value })} /></Field>
          </div>
          <Field label="Fan"><input className={inp} value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></Field>
          <Field label="O'qituvchi"><input className={inp} value={editing.teacher_name} onChange={(e) => setEditing({ ...editing, teacher_name: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setEditing(null)}>Bekor</Btn>
            <Btn onClick={save} busy={busy}>Saqlash</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

const Th = ({ children }: any) => <th className="text-left font-medium px-4 py-2.5 whitespace-nowrap">{children}</th>;
const Td = ({ children, className = "" }: any) => <td className={`px-4 py-2.5 whitespace-nowrap ${className}`}>{children}</td>;