import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Navigate } from "react-router-dom";
import {
  Loader2, Plus, Send, Paperclip, ArrowLeft, Users, Search, X,
  MessageSquarePlus, UserPlus, Check, Trash2, Globe, Lock, Hourglass,
} from "lucide-react";
import { toast } from "sonner";
import { Btn, inp } from "@/components/admin/ui";
import { useUnread } from "@/hooks/useUnread";

type Room = {
  id: string; name: string; is_group: boolean; is_public: boolean;
  avatar_url: string | null; created_by: string | null;
};
type Message = {
  id: string; room_id: string; sender_id: string; content: string | null;
  attachment_url: string | null; attachment_name: string | null; attachment_size: number | null;
  created_at: string;
};
type Profile = { id: string; full_name: string; avatar_url: string | null };
type ProfileMap = Record<string, Profile>;
type JoinReq = { id: string; room_id: string; user_id: string; status: string; created_at: string };

const MAX_CHAT_FILE = 15 * 1024 * 1024;

export default function Chat() {
  const { user, loading } = useAuth();
  const { isSuper } = useRoles();
  const { map: summaries, markRead } = useUnread();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pane, setPane] = useState<"create" | "discover" | "users" | null>(null);
  const [myRequests, setMyRequests] = useState<JoinReq[]>([]);

  useEffect(() => {
    if (!user) return;
    loadRooms();
    loadMyRequests();
    const ch = api
      .channel("rooms:" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_members", filter: `user_id=eq.${user.id}` }, loadRooms)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_join_requests", filter: `user_id=eq.${user.id}` }, loadMyRequests)
      .subscribe();
    return () => { };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadRooms() {
    try {
      const data = await api.getChatRooms();
      setRooms(data as Room[]);
    } catch(e) { /* ignore */ }
  }
  

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const active = rooms.find((r) => r.id === activeId) ?? null;

  useEffect(() => {
    if (activeId) markRead(activeId);
  }, [activeId, markRead, summaries[activeId ?? ""]?.last_at]);

  const sortedRooms = [...rooms].sort((a, b) => {
    const aT = summaries[a.id]?.last_at ?? "";
    const bT = summaries[b.id]?.last_at ?? "";
    return bT.localeCompare(aT);
  });

  return (
    <div className="fixed inset-0 bg-background pt-safe flex flex-col">
      <div className="flex-1 grid md:grid-cols-[340px,1fr] min-h-0">
        <aside className={`border-r border-border flex flex-col ${active ? "hidden md:flex" : "flex"}`}>
          <div className="h-14 px-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <a href="/" className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></a>
              <span className="font-semibold">Chat</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPane("users")} title="Foydalanuvchi topish" className="grid h-8 w-8 place-items-center rounded-full bg-secondary hover:bg-muted"><Search className="h-4 w-4" /></button>
              <button onClick={() => setPane("discover")} title="Ochiq guruhlar" className="grid h-8 w-8 place-items-center rounded-full bg-secondary hover:bg-muted"><Globe className="h-4 w-4" /></button>
              <button onClick={() => setPane("create")} title="Yangi guruh" className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {rooms.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Hozircha chatlar yo'q. <br />Yangi guruh yarating yoki foydalanuvchi qidiring.
              </div>
            )}
            {sortedRooms.map((r) => (
              <RoomRow
                key={r.id}
                room={r}
                active={activeId === r.id}
                userId={user.id}
                onOpen={() => setActiveId(r.id)}
                onDeleted={loadRooms}
                canSuperDelete={isSuper}
                summary={summaries[r.id]}
              />
            ))}
          </div>
        </aside>
        <section className={`flex flex-col min-h-0 ${active ? "flex" : "hidden md:flex"}`}>
          {active ? (
            <RoomView key={active.id} room={active} onBack={() => setActiveId(null)} userId={user.id} canSuperDelete={isSuper} onDeleted={() => { setActiveId(null); loadRooms(); }} />
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">Chat tanlang</div>
          )}
        </section>
      </div>
      {pane === "create" && <CreateRoomDialog onClose={() => setPane(null)} onCreated={(id) => { setPane(null); loadRooms(); setActiveId(id); }} />}
      {pane === "discover" && <DiscoverDialog onClose={() => setPane(null)} userId={user.id} myRequests={myRequests} onChanged={loadMyRequests} memberRoomIds={rooms.map((r) => r.id)} />}
      {pane === "users" && <UserSearchDialog onClose={() => setPane(null)} userId={user.id} onOpenRoom={(id) => { setPane(null); loadRooms(); setActiveId(id); }} />}
    </div>
  );
}

function RoomRow({ room, active, userId, onOpen, onDeleted, canSuperDelete, summary }: {
  room: Room; active: boolean; userId: string; onOpen: () => void; onDeleted: () => void; canSuperDelete: boolean;
  summary?: { unread: number; last_content: string | null; last_at: string | null; last_sender_id: string | null };
}) {
  const [other, setOther] = useState<Profile | null>(null);
  useEffect(() => {
    if (room.is_group) return;
    (async () => {
      const { data } = await api.from("chat_members").select("user_id").eq("room_id", room.id);
      const otherId = (data ?? []).map((m: any) => m.user_id).find((id: string) => id !== userId);
      if (!otherId) return;
      const { data: p } = await api.from("profiles").select("id,full_name,avatar_url").eq("id", otherId).maybeSingle();
      if (p) setOther(p as Profile);
    })();
  }, [room.id, room.is_group, userId]);
  const title = room.is_group ? room.name : other?.full_name ?? "Shaxsiy chat";
  const avatar = room.is_group ? null : other?.avatar_url;
  const unread = summary?.unread ?? 0;
  const preview = summary?.last_content ?? (room.is_group ? (room.is_public ? "Ochiq guruh" : "Yopiq guruh") : "Shaxsiy");
  const timeLabel = summary?.last_at ? new Date(summary.last_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${active ? "bg-secondary" : "hover:bg-secondary/60"}`}>
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 text-left min-w-0">
        {avatar ? (
          <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold">
            {title.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium truncate flex-1">{title}</div>
            {timeLabel && <div className="text-[10px] text-muted-foreground shrink-0">{timeLabel}</div>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`text-xs truncate flex-1 ${unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{preview}</div>
            {unread > 0 && (
              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground shrink-0">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
        </div>
      </button>
      {canSuperDelete && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (!confirm("Chatni o'chirishni tasdiqlaysizmi?")) return;
            const { error } = await api.from("chat_rooms").delete().eq("id", room.id);
            if (error) toast.error(error.message); else { toast.success("O'chirildi"); onDeleted(); }
          }}
          className="opacity-0 group-hover:opacity-100 grid h-8 w-8 place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
          title="SuperAdmin: o'chirish"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function RoomView({ room, onBack, userId, canSuperDelete, onDeleted }: {
  room: Room; onBack: () => void; userId: string; canSuperDelete: boolean; onDeleted: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [requests, setRequests] = useState<JoinReq[]>([]);
  const [showReq, setShowReq] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOwner = room.created_by === userId;

  useEffect(() => {
    load();
    api.from("chat_members").select("user_id", { count: "exact", head: true }).eq("room_id", room.id).then(({ count }) => setMemberCount(count ?? 0));
    if (isOwner && room.is_group) loadRequests();
    const ch = api
      .channel(`room:${room.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${room.id}` }, (p) => {
        setMessages((m) => [...m, p.new as Message]);
        ensureProfile((p.new as Message).sender_id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_join_requests", filter: `room_id=eq.${room.id}` }, () => { if (isOwner) loadRequests(); })
      .subscribe();
    return () => {  };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function load() {
    const { data } = await await api.list("chat_messages", "order=created_at");
    const msgs = (data ?? []) as Message[];
    setMessages(msgs);
    const ids = Array.from(new Set(msgs.map((m) => m.sender_id)));
    if (ids.length) {
      const { data: profs } = await api.from("profiles").select("id,full_name,avatar_url").in("id", ids);
      const map: ProfileMap = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  }
  async function loadRequests() {
    const { data } = await api.from("chat_join_requests").select("*").eq("room_id", room.id).eq("status", "pending");
    setRequests((data ?? []) as JoinReq[]);
  }
  async function ensureProfile(id: string) {
    if (profiles[id]) return;
    const { data } = await api.from("profiles").select("id,full_name,avatar_url").eq("id", id).maybeSingle();
    if (data) setProfiles((p) => ({ ...p, [id]: data as Profile }));
  }
  async function send(extra?: Partial<Message>) {
    const body = text.trim();
    if (!body && !extra?.attachment_url) return;
    setSending(true);
    const { error } = await api.from("chat_messages").insert({ room_id: room.id, sender_id: userId, content: body || null, ...extra });
    setSending(false);
    if (error) toast.error(error.message); else setText("");
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > MAX_CHAT_FILE) { toast.error("Fayl 15MB dan oshmasligi kerak"); return; }
    setSending(true);
    const path = `${userId}/${Date.now()}-${f.name}`;
    const up = await api.storage.from("chat-files").upload(path, f);
    if (up.error) { setSending(false); toast.error(up.error.message); return; }
    const { data: signed } = await api.storage.from("chat-files").createSignedUrl(path, 60 * 60 * 24 * 365);
    setSending(false);
    if (!signed?.signedUrl) { toast.error("URL olinmadi"); return; }
    await send({ attachment_url: signed.signedUrl, attachment_name: f.name, attachment_size: f.size });
  }

  return (
    <>
      <header className="h-14 border-b border-border px-4 flex items-center gap-3">
        <button onClick={onBack} className="md:hidden grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold">
          {room.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{room.name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{memberCount} a'zo</div>
        </div>
        {isOwner && room.is_group && (
          <button onClick={() => setShowReq(true)} className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-secondary" title="Qoʻshilish soʻrovlari">
            <UserPlus className="h-4 w-4" />
            {requests.length > 0 && <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{requests.length}</span>}
          </button>
        )}
        {canSuperDelete && (
          <button onClick={async () => {
            if (!confirm("Chatni o'chirishni tasdiqlaysizmi?")) return;
            const { error } = await api.from("chat_rooms").delete().eq("id", room.id);
            if (error) toast.error(error.message); else { toast.success("O'chirildi"); onDeleted(); }
          }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-destructive/10 text-destructive" title="SuperAdmin: o'chirish">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-1 bg-secondary/20">
        {messages.map((m, i) => {
          const mine = m.sender_id === userId;
          const prev = messages[i - 1];
          const showName = !mine && (!prev || prev.sender_id !== m.sender_id) && room.is_group;
          const p = profiles[m.sender_id];
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "glass-card-subtle rounded-bl-md"}`}>
                {showName && <div className="text-[11px] font-medium text-primary mb-0.5">{p?.full_name ?? "Foydalanuvchi"}</div>}
                {m.attachment_url && (
                  /\.(png|jpe?g|webp|gif)$/i.test(m.attachment_name ?? "") ? (
                    <a href={m.attachment_url} target="_blank" rel="noreferrer"><img src={m.attachment_url} alt="" className="rounded-xl mb-1 max-h-80" /></a>
                  ) : (
                    <a href={m.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline mb-1">
                      <Paperclip className="h-3.5 w-3.5" /> {m.attachment_name}
                    </a>
                  )
                )}
                {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                <div className={`text-[10px] mt-0.5 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"} text-right`}>
                  {new Date(m.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border p-2 sm:p-3 flex items-end gap-2 bg-background pb-safe">
        <button type="button" onClick={() => fileInput.current?.click()} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary" aria-label="Fayl">
          <Paperclip className="h-5 w-5" />
        </button>
        <input ref={fileInput} type="file" hidden onChange={onFile} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
          placeholder="Xabar yozing…"
          className="flex-1 resize-none px-4 py-2.5 rounded-2xl bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 max-h-32"
        />
        <button type="submit" disabled={sending} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
      {showReq && <RequestsDialog roomId={room.id} requests={requests} onClose={() => setShowReq(false)} onChanged={loadRequests} />}
    </>
  );
}

function CreateRoomDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    const { data, error } = await api
      .from("chat_rooms")
      .insert({ name: name.trim(), is_group: true, is_public: isPublic, created_by: user!.id })
      .select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Guruh yaratildi");
    onCreated((data as any).id);
  }
  return (
    <Modal onClose={onClose} title="Yangi guruh">
      <input className={inp} placeholder="Guruh nomi" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <label className="flex items-center gap-2 mt-3 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Ochiq guruh — boshqalar topib, qoʻshilish soʻrovi yubora oladi
      </label>
      <div className="flex justify-end gap-2 mt-5">
        <Btn variant="secondary" onClick={onClose}>Bekor qilish</Btn>
        <Btn busy={busy} onClick={create}>Yaratish</Btn>
      </div>
    </Modal>
  );
}

function DiscoverDialog({ onClose, userId, myRequests, onChanged, memberRoomIds }: {
  onClose: () => void; userId: string; myRequests: JoinReq[]; onChanged: () => void; memberRoomIds: string[];
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await await api.list("chat_rooms", "order=created_at");
      setRooms((data ?? []) as Room[]);
      setLoading(false);
    })();
  }, []);
  const reqMap = useMemo(() => new Map(myRequests.map((r) => [r.room_id, r])), [myRequests]);
  const filtered = rooms.filter((r) => !memberRoomIds.includes(r.id) && r.name.toLowerCase().includes(q.toLowerCase()));
  async function requestJoin(roomId: string) {
    const { error } = await api.from("chat_join_requests").insert({ room_id: roomId, user_id: userId, status: "pending" });
    if (error) toast.error(error.message); else { toast.success("Soʻrov yuborildi"); onChanged(); }
  }
  return (
    <Modal onClose={onClose} title="Ochiq guruhlar">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary mb-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Guruh nomi…" className="flex-1 bg-transparent outline-none text-sm" />
      </div>
      <div className="max-h-[55vh] overflow-y-auto space-y-1">
        {loading && <div className="p-6 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Yuklanmoqda…</div>}
        {!loading && filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Hech narsa topilmadi</div>}
        {filtered.map((r) => {
          const req = reqMap.get(r.id);
          return (
            <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold">{r.name.slice(0, 1).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground">Ochiq guruh</div>
              </div>
              {req?.status === "pending" ? (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Hourglass className="h-3 w-3" />Kutilmoqda</span>
              ) : req?.status === "rejected" ? (
                <span className="text-xs text-destructive">Rad etilgan</span>
              ) : (
                <Btn onClick={() => requestJoin(r.id)}>Qoʻshilish</Btn>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function UserSearchDialog({ onClose, userId, onOpenRoom }: { onClose: () => void; userId: string; onOpenRoom: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 1) { setResults([]); return; }
      setLoading(true);
      const { data } = await api.from("profiles").select("id,full_name,avatar_url").ilike("full_name", `%${q.trim()}%`).neq("id", userId).limit(20);
      setResults((data ?? []) as Profile[]);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, userId]);

  async function startDM(other: Profile) {
    setBusy(other.id);
    try {
      // Try find existing 1-1 room
      const { data: myRooms } = await api.from("chat_members").select("room_id").eq("user_id", userId);
      const ids = (myRooms ?? []).map((m: any) => m.room_id);
      let existing: string | null = null;
      if (ids.length) {
        const { data: rs } = await api.from("chat_rooms").select("id").in("id", ids).eq("is_group", false);
        for (const r of (rs ?? []) as { id: string }[]) {
          const { data: mm } = await api.from("chat_members").select("user_id").eq("room_id", r.id);
          const uids = (mm ?? []).map((x: any) => x.user_id).sort();
          if (uids.length === 2 && uids.includes(other.id) && uids.includes(userId)) { existing = r.id; break; }
        }
      }
      if (existing) { onOpenRoom(existing); return; }
      const { data: room, error } = await api
        .from("chat_rooms")
        .insert({ name: other.full_name || "Shaxsiy", is_group: false, is_public: false, created_by: userId })
        .select("id").single();
      if (error || !room) throw error ?? new Error("Xona yaratilmadi");
      const { error: memErr } = await api.from("chat_members").insert({ room_id: room.id, user_id: other.id, is_admin: false });
      if (memErr) throw memErr;
      onOpenRoom(room.id);
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal onClose={onClose} title="Foydalanuvchi topish">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary mb-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="Ism boʻyicha qidirish…" className="flex-1 bg-transparent outline-none text-sm" />
      </div>
      <div className="max-h-[55vh] overflow-y-auto space-y-1">
        {loading && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Qidirilmoqda…</div>}
        {!loading && q && results.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Topilmadi</div>}
        {results.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold">{(p.full_name || "?").slice(0, 1).toUpperCase()}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{p.full_name || "Foydalanuvchi"}</div>
            </div>
            <Btn busy={busy === p.id} onClick={() => startDM(p)}><MessageSquarePlus className="h-4 w-4 mr-1" />Yozish</Btn>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function RequestsDialog({ roomId, requests, onClose, onChanged }: {
  roomId: string; requests: JoinReq[]; onClose: () => void; onChanged: () => void;
}) {
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      if (!requests.length) return;
      const ids = requests.map((r) => r.user_id);
      const { data } = await api.from("profiles").select("id,full_name,avatar_url").in("id", ids);
      const map: ProfileMap = {};
      (data ?? []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    })();
  }, [requests]);
  async function decide(req: JoinReq, accept: boolean) {
    setBusy(req.id);
    try {
      if (accept) {
        const { error: mErr } = await api.from("chat_members").insert({ room_id: roomId, user_id: req.user_id, is_admin: false });
        if (mErr && !String(mErr.message).includes("duplicate")) throw mErr;
      }
      const { error } = await api.from("chat_join_requests").update({ status: accept ? "accepted" : "rejected" }).eq("id", req.id);
      if (error) throw error;
      toast.success(accept ? "Qabul qilindi" : "Rad etildi");
      onChanged();
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally { setBusy(null); }
  }
  return (
    <Modal onClose={onClose} title="Qoʻshilish soʻrovlari">
      {requests.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Soʻrovlar yoʻq</div>}
      <div className="space-y-1 max-h-[55vh] overflow-y-auto">
        {requests.map((r) => {
          const p = profiles[r.user_id];
          return (
            <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold">{(p?.full_name || "?").slice(0, 1).toUpperCase()}</div>
              <div className="flex-1 min-w-0 text-sm truncate">{p?.full_name ?? "Foydalanuvchi"}</div>
              <button disabled={busy === r.id} onClick={() => decide(r, true)} className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50" title="Qabul qilish"><Check className="h-4 w-4" /></button>
              <button disabled={busy === r.id} onClick={() => decide(r, false)} className="grid h-8 w-8 place-items-center rounded-lg bg-secondary hover:bg-muted disabled:opacity-50" title="Rad etish"><X className="h-4 w-4" /></button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-md glass-card rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
