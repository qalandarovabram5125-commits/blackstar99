import { Fragment, useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import { Card, PageHeader, inp } from "@/components/admin/ui";
import { fmtDateTime } from "@/lib/format";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

export default function AdminAudit() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(2000)
      .then(({ data }) => { setRows(data ?? []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.actor_email, r.action, r.entity, r.entity_id, JSON.stringify(r.meta ?? {})]
        .filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div>
      <PageHeader title="Audit jurnali" subtitle={`To'liq log · ${rows.length} ta yozuv`} />
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish: email, amal, obyekt, meta…" className={`${inp} pl-9`} />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th className="w-8"></th>
                <th className="text-left px-3 py-2">Vaqt</th>
                <th className="text-left px-3 py-2">Foydalanuvchi</th>
                <th className="text-left px-3 py-2">Amal</th>
                <th className="text-left px-3 py-2">Obyekt</th>
                <th className="text-left px-3 py-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Yuklanmoqda…</td></tr>}
              {!loading && filtered.map((r) => {
                const has = r.meta || r.actor_id;
                const isOpen = !!open[r.id];
                return (
                  <Fragment key={r.id}>
                    <tr className="border-t border-border hover:bg-secondary/40 cursor-pointer" onClick={() => has && setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}>
                      <td className="px-2 py-2">{has ? (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : null}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(r.created_at)}</td>
                      <td className="px-3 py-2">{r.actor_email ?? "—"}</td>
                      <td className="px-3 py-2 font-medium">{r.action}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.entity ?? "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{r.entity_id ?? "—"}</td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-secondary/30 border-t border-border">
                        <td></td>
                        <td colSpan={5} className="px-3 py-3">
                          <div className="text-xs text-muted-foreground mb-1">actor_id: <span className="font-mono">{r.actor_id ?? "—"}</span></div>
                          <pre className="text-xs bg-background border border-border rounded-lg p-3 overflow-auto max-h-64">{JSON.stringify(r.meta ?? {}, null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-10">Yozuvlar yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}