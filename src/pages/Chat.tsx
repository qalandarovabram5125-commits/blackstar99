import { useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2, Plus, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Btn, inp } from "@/components/admin/ui";

type Room = { id: string; name: string; is_group: number; };
type Message = { id: string; sender_id: string; sender_name: string; content: string; created_at: string; };

export default function Chat() {
  const { user, loading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (user) loadRooms();
  }, [user]);

  async function loadRooms() {
    try {
      const data = await api.getChatRooms();
      setRooms(data as Room[]);
    } catch { /* ignore */ }
  }

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const active = rooms.find((r) => r.id === activeId) ?? null;

  return (
    <div className="fixed inset-0 bg-background pt-safe flex flex-col">
      <div className="flex-1 grid md:grid-cols-[340px,1fr] min-h-0">
        <aside className={`border-r border-border flex flex-col ${active ? "hidden md:flex" : "flex"}`}>
          <div className="h-14 px-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <a href="/" className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></a>
              <span className="font-semibold">Chat</span>
            </div>
            <button onClick={() => setShowCreate(true)} className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90" title="Yangi guruh">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {rooms.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Hozircha chatlar yo'q. <br />Yangi guruh yarating.
              </div>
            )}
            {rooms.map((r) => (
              <div key={r.id}
                onClick={() => setActiveId(r.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition ${activeId === r.id ? "bg-secondary" : "hover:bg-secondary/60"}`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold">
                  {r.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-sm font-medium truncate">{r.name}</div>
              </div>
            ))}
          </div>
        </aside>

        <section className={`flex flex-col min-h-0 ${active ? "flex" : "hidden md:flex"}`}>
          {active ? (
            <RoomView key={active.id} room={active} userId={user.id} onBack={() => setActiveId(null)} />
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Chat tanlang</div>
          )}
        </section>
      </div>
      {showCreate && <CreateDialog onClose={() => setShowCreate(false)} onCreated={(id) => { setShowCreate(false); loadRooms(); setActiveId(id); }} />}
    </div>
  );
}

function RoomView({ room, userId, onBack }: { room: Room; userId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [room.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function loadMessages() {
    try {
      const msgs = await api.getMessages(room.id);
      setMessages(msgs as Message[]);
      setLoading(false);
    } catch { setLoading(false); }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.sendMessage(room.id, body);
      setText("");
      loadMessages();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <header className="h-14 border-b border-border px-4 flex items-center gap-3">
        <button onClick={onBack} className="md:hidden grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold">
          {room.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="text-sm font-semibold truncate">{room.name}</div>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-1 bg-secondary/20">
        {loading ? (
          <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Hozircha xabarlar yo'q</div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "glass-card-subtle rounded-bl-md"}`}>
                  {!mine && <div className="text-[11px] font-medium text-primary mb-0.5">{m.sender_name || "Foydalanuvchi"}</div>}
                  {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                  <div className={`text-[10px] mt-0.5 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"} text-right`}>
                    {new Date(m.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={send} className="border-t border-border p-2 sm:p-3 flex items-end gap-2 bg-background pb-safe">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e as any); } }}
          rows={1}
          placeholder="Xabar yozing…"
          className="flex-1 resize-none px-4 py-2.5 rounded-2xl bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 max-h-32"
        />
        <button type="submit" disabled={sending} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </>
  );
}

function CreateDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const room = await api.createChatRoom(name.trim(), true);
      toast.success("Guruh yaratildi");
      onCreated(room.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-md glass-card rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Yangi guruh</h3>
        <input className={inp} placeholder="Guruh nomi" value={name} onChange={(e) => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && create()} />
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="secondary" onClick={onClose}>Bekor qilish</Btn>
          <Btn busy={busy} onClick={create}>Yaratish</Btn>
        </div>
      </div>
    </div>
  );
}
